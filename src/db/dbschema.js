import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'data', 'meshmanager.db');
console.log('Opening DB at:', dbPath);

const db = new Database(dbPath);

export const buildUserInfoTables = () => {
  db.exec(`
    -- myInfo table defines each of our nodes and their mappings
    CREATE TABLE IF NOT EXISTS my_info (
      myNodeNum INTEGER PRIMARY KEY,
      deviceId TEXT,
      rebootCount INTEGER,
      minAppVersion INTEGER,
      pioEnv TEXT,
      currentIP TEXT,         -- ← explicit IP address for mapping
      connId TEXT,            -- ← multiplexing identifier
      timestamp INTEGER
    );


    -- Nodes table with current position fields
    CREATE TABLE IF NOT EXISTS nodes (
        num        INTEGER PRIMARY KEY,
        label      TEXT,
        device_id  TEXT,
        user_id    TEXT,
        long_name  TEXT,
        short_name TEXT,
        hw_model   TEXT,
        latitude   REAL,
        longitude  REAL,
        altitude   REAL,
        last_seen  INTEGER,
        viaMqtt    BOOLEAN,
        hopsAway   INTEGER,
        lastHeard  INTEGER
    );

    CREATE TABLE IF NOT EXISTS node_users (
      nodeNum INTEGER PRIMARY KEY,
      userId TEXT,
      longName TEXT,
      shortName TEXT,
      macaddr TEXT,
      hwModel INTEGER,
      publicKey TEXT,
      isUnmessagable BOOLEAN,
      updatedAt INTEGER,
      FOREIGN KEY (nodeNum) REFERENCES nodes(num)
    );

    CREATE TABLE IF NOT EXISTS node_metrics (
      nodeNum INTEGER PRIMARY KEY,
      lastHeard INTEGER,
      metrics TEXT NOT NULL,
      updatedAt INTEGER
      --FOREIGN KEY (nodeNum) REFERENCES nodes(num) DEFERRABLE INITIALLY DEFERRED
    );


    -- Positions table for historical logging
    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY,
      fromNodeNum INTEGER NOT NULL,
      toNodeNum INTEGER NOT NULL DEFAULT 4294967295,
      latitude REAL,
      longitude REAL,
      altitude REAL,
      timestamp INTEGER,
      FOREIGN KEY (fromNodeNum) REFERENCES nodes(num)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      longName TEXT,
      shortName TEXT,
      macaddr TEXT,
      hwModel INTEGER,
      publicKey TEXT,
      isUnmessagable BOOLEAN,
      nodeNum INTEGER,
      FOREIGN KEY (nodeNum) REFERENCES nodes(num)
    );

   CREATE TABLE IF NOT EXISTS channels (
      channel_num INTEGER PRIMARY KEY,
      num INTEGER,
      "index" INTEGER,
      name TEXT,
      role TEXT,
      psk TEXT,
      uplink_enabled BOOLEAN,
      downlink_enabled BOOLEAN,
      module_settings_json TEXT,
      timestamp INTEGER DEFAULT (strftime('%s','now')),
      FOREIGN KEY (num) REFERENCES nodes(num)
    );

    CREATE TABLE IF NOT EXISTS messages (
      message_id TEXT PRIMARY KEY,
      fromNodeNum INTEGER,
      toNodeNum INTEGER,
      channel_id TEXT,
      sender TEXT,
      content TEXT,
      emoji INTEGER,
      viaMqtt BOOLEAN,
      timestamp INTEGER
      --FOREIGN KEY (channel_id) REFERENCES channels(channel_id)
    );

    CREATE TABLE IF NOT EXISTS connections (
      connection_id TEXT PRIMARY KEY,
      num INTEGER,
      transport TEXT,
      status TEXT,
      FOREIGN KEY (num) REFERENCES nodes(num)
    );

    CREATE TABLE IF NOT EXISTS device_ip_map (
      source_ip TEXT PRIMARY KEY,          -- Transport-level origin (TCP/Mesh/WebSocket/TCP Server)
      num INTEGER NOT NULL,                -- Mesh node number
      device_id TEXT,                      -- Canonical device identifier
      last_seen INTEGER NOT NULL           -- Unix timestamp (ms) of last packet seen from this IP
    );
 `);
};

export const buildMetricsTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS device_metrics (
      num INTEGER,
      timestamp INTEGER DEFAULT (strftime('%s','now')),
      batteryLevel INTEGER,
      voltage REAL,
      channelUtilization REAL,
      airUtilTx REAL,
      uptimeSeconds INTEGER,
      FOREIGN KEY (num) REFERENCES nodes(num)
    );

    CREATE TABLE IF NOT EXISTS packet_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      num INTEGER,
      packet_type TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      raw_payload TEXT
    );

    CREATE TABLE IF NOT EXISTS telemetry (
      telemetryId INTEGER PRIMARY KEY AUTOINCREMENT,
      fromNodeNum INTEGER NOT NULL,
      toNodeNum INTEGER NOT NULL DEFAULT 4294967295,
      metric TEXT,
      value REAL,
      timestamp INTEGER,
      FOREIGN KEY (fromNodeNum) REFERENCES nodes(num)
    );

    CREATE TABLE IF NOT EXISTS event_emissions (
      event_id INTEGER PRIMARY KEY AUTOINCREMENT,
      num INTEGER,
      event_type TEXT,
      details TEXT,
      timestamp INTEGER,
      FOREIGN KEY (num) REFERENCES nodes(num)
    );

    CREATE TABLE IF NOT EXISTS file_info (
      file_info_id INTEGER PRIMARY KEY AUTOINCREMENT,
      num INTEGER,
      filename TEXT,
      size INTEGER,
      mime_type TEXT,
      description TEXT,
      timestamp INTEGER DEFAULT (strftime('%s','now')),
      conn_id TEXT,
      FOREIGN KEY (num) REFERENCES nodes(num)
    );
    
    CREATE TABLE IF NOT EXISTS queue_status (
      status_id INTEGER PRIMARY KEY AUTOINCREMENT,
      num INTEGER,
      res INTEGER,
      free INTEGER,
      maxlen INTEGER,
      mesh_packet_id INTEGER,
      timestamp INTEGER DEFAULT (strftime('%s','now')),
      conn_id TEXT,
      FOREIGN KEY (num) REFERENCES nodes(num)
    );

        -- Device Metrics
    CREATE TABLE IF NOT EXISTS device_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fromNodeNum INTEGER NOT NULL,
      toNodeNum INTEGER NOT NULL DEFAULT 4294967295,
      batteryLevel REAL,
      txPower INTEGER,
      uptime INTEGER,
      cpuTemp REAL,
      memoryUsage REAL,
      timestamp INTEGER,
      FOREIGN KEY (fromNodeNum) REFERENCES nodes(num)
    );

    -- Environment Metrics
    CREATE TABLE IF NOT EXISTS environment_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fromNodeNum INTEGER NOT NULL,
      toNodeNum INTEGER NOT NULL DEFAULT 4294967295,
      temperature REAL,
      humidity REAL,
      pressure REAL,
      lightLevel REAL,
      timestamp INTEGER,
      FOREIGN KEY (fromNodeNum) REFERENCES nodes(num)
    );

    -- Air Quality Metrics
    CREATE TABLE IF NOT EXISTS air_quality_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fromNodeNum INTEGER NOT NULL,
      toNodeNum INTEGER NOT NULL DEFAULT 4294967295,
      pm25 REAL,
      pm10 REAL,
      co2 REAL,
      voc REAL,
      ozone REAL,
      timestamp INTEGER,
      FOREIGN KEY (fromNodeNum) REFERENCES nodes(num)
    );

    -- Power Metrics
    CREATE TABLE IF NOT EXISTS power_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fromNodeNum INTEGER NOT NULL,
      toNodeNum INTEGER NOT NULL DEFAULT 4294967295,
      voltage REAL,
      current REAL,
      power REAL,
      energy REAL,
      frequency REAL,
      timestamp INTEGER,
      FOREIGN KEY (fromNodeNum) REFERENCES nodes(num)
    );

    -- Local Stats
    CREATE TABLE IF NOT EXISTS local_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fromNodeNum INTEGER NOT NULL,
      toNodeNum INTEGER NOT NULL DEFAULT 4294967295,
      snr REAL,
      rssi REAL,
      hopCount INTEGER,
      linkQuality REAL,
      packetLoss REAL,
      timestamp INTEGER,
      FOREIGN KEY (fromNodeNum) REFERENCES nodes(num)
    );

    -- Health Metrics
    CREATE TABLE IF NOT EXISTS health_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fromNodeNum INTEGER NOT NULL,
      toNodeNum INTEGER NOT NULL DEFAULT 4294967295,
      cpuTemp REAL,
      diskUsage REAL,
      memoryUsage REAL,
      uptime INTEGER,
      loadAvg REAL,
      timestamp INTEGER,
      FOREIGN KEY (fromNodeNum) REFERENCES nodes(num)
    );

    -- Host Metrics
    CREATE TABLE IF NOT EXISTS host_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fromNodeNum INTEGER NOT NULL,
      toNodeNum INTEGER NOT NULL DEFAULT 4294967295,
      hostname TEXT,
      uptime INTEGER,
      loadAvg REAL,
      osVersion TEXT,
      bootTime INTEGER,
      timestamp INTEGER,
      FOREIGN KEY (fromNodeNum) REFERENCES nodes(num)
    );

    CREATE TABLE IF NOT EXISTS config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      num INTEGER NOT NULL,
      timestamp INTEGER,
      type TEXT NOT NULL, -- e.g. "device", "network", "power"
      payload TEXT NOT NULL, -- JSON-encoded config object
      device_id TEXT,
      conn_Id TEXT,
      FOREIGN KEY (num) REFERENCES nodes(num)
    );

    CREATE TABLE IF NOT EXISTS module_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      num INTEGER NOT NULL,
      timestamp INTEGER,
      type TEXT NOT NULL, -- e.g. "device", "network", "power"
      payload TEXT NOT NULL, -- JSON-encoded config object
      device_id TEXT,
      conn_Id TEXT,
      FOREIGN KEY (num) REFERENCES nodes(num)
    );

    CREATE TABLE IF NOT EXISTS log_records (
      num INTEGER PRIMARY KEY,               -- Canonical packet number
      packetType TEXT NOT NULL DEFAULT 'logRecord',
      rawMessage BLOB NOT NULL,              -- Binary payload, undecoded
      timestamp INTEGER NOT NULL,            -- Epoch millis or seconds
      connId TEXT,                           -- Optional: connection context
      decodeStatus TEXT DEFAULT 'pending'    -- 'pending', 'decoded', 'error'
    );

  `);
};

export const buildDeviceConfigTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      device_id TEXT PRIMARY KEY,
      num INTEGER,
      conn_id TEXT,
      device_type TEXT DEFAULT 'meshtastic',
      last_seen INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS device_settings (
        device_id    TEXT    NOT NULL,
        num          INTEGER,
        config_type  TEXT    NOT NULL,
        config_json  TEXT    NOT NULL,
        conn_id      TEXT,
        updated_at   INTEGER NOT NULL,
        PRIMARY KEY (device_id, config_type)
        -- FOREIGN KEY (device_id) REFERENCES devices(device_id),
        -- FOREIGN KEY (num) REFERENCES nodes(num)
    );


    CREATE TABLE IF NOT EXISTS device_meta (
      device_id TEXT REFERENCES devices(device_id),
      reboot_count INTEGER,
      min_app_version INTEGER,
      pio_env TEXT,
      firmware_version TEXT,
      hw_model INTEGER,
      conn_id TEXT,
      updated_at INTEGER DEFAULT (strftime('%s','now')),
      timestamp INTEGER DEFAULT (strftime('%s','now'))
    );
  `);
};

export default db;
