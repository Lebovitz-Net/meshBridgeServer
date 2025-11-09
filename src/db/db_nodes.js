export const dbNodes = [
    `CREATE TABLE IF NOT EXISTS my_info (
      myNodeNum INTEGER PRIMARY KEY,
      nodeType INTEGER DEFAULT 0,
      deviceId TEXT,
      rebootCount INTEGER,
      minAppVersion INTEGER,
      pioEnv TEXT,
      currentIP TEXT,
      connId TEXT,
      timestamp INTEGER
    );`,

    `CREATE TABLE IF NOT EXISTS nodes (
      num INTEGER PRIMARY KEY,
      nodeType INTEGER DEFAULT 0,
      label TEXT,
      device_id TEXT,
      last_seen INTEGER,
      viaMqtt BOOLEAN,
      hopsAway INTEGER,
      lastHeard INTEGER
    );`,

    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nodeNum INTEGER,
      nodeType INTEGER DEFAULT 0,
      longName TEXT,
      shortName TEXT,
      macaddr TEXT,
      hwModel INTEGER,
      publicKey TEXT,
      isUnmessagable BOOLEAN,
      updatedAt INTEGER,
      FOREIGN KEY (nodeNum) REFERENCES nodes(num)
    );`,

    `CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY,
      fromNodeNum INTEGER NOT NULL,
      fromNodeType INTEGER DEFAULT 0,
      toNodeNum INTEGER NOT NULL DEFAULT 4294967295,
      toNodeType INTEGER DEFAULT 0,
      latitude REAL,
      longitude REAL,
      altitude REAL,
      timestamp INTEGER
    );`,

    `CREATE TABLE IF NOT EXISTS channels (
      channel_num INTEGER PRIMARY KEY,
      num INTEGER,
      nodeType INTEGER DEFAULT 0,
      "index" INTEGER,
      name TEXT,
      role TEXT,
      psk TEXT,
      uplink_enabled BOOLEAN,
      downlink_enabled BOOLEAN,
      module_settings_json TEXT,
      timestamp INTEGER DEFAULT (strftime('%s','now')),
      FOREIGN KEY (num) REFERENCES my_info(myNodeNum)
    );`,

];
