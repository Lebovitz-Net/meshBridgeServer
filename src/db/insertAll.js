import db from './dbschema.js';

/**
 * Inserts or updates a node's user identity into node_users.
 *
 * @param {Object} user - The user object from NodeInfo
 * @param {number} nodeNum - The node's canonical identifier
 */
export function insertNodeUsers(user, nodeNum) {
  db.prepare(`
    INSERT INTO node_users (
      nodeNum, userId, longName, shortName, macaddr,
      hwModel, publicKey, isUnmessagable, updatedAt
    ) VALUES (
      @nodeNum, @userId, @longName, @shortName, @macaddr,
      @hwModel, @publicKey, @isUnmessagable, @updatedAt
    )
    ON CONFLICT(nodeNum) DO UPDATE SET
      userId = excluded.userId,
      longName = excluded.longName,
      shortName = excluded.shortName,
      macaddr = excluded.macaddr,
      hwModel = excluded.hwModel,
      publicKey = excluded.publicKey,
      isUnmessagable = excluded.isUnmessagable,
      updatedAt = excluded.updatedAt
  `).run({
    nodeNum,
    userId: user.id,
    longName: user.longName,
    shortName: user.shortName,
    macaddr: user.macaddr,
    hwModel: user.hwModel,
    publicKey: user.publicKey,
    isUnmessagable: user.isUnmessagable ? 1 : 0,
    updatedAt: Date.now()
  });
}
import db from './dbschema.js';

export function insertClientNotification(subPacket) {
  const { fromNodeNum, key, data, timestamp, device_id, connId } = subPacket;

  db.prepare(`
    INSERT INTO client_notification (
      num, type, payload, timestamp, device_id, conn_id
    ) VALUES ( ?, ?, ?, ?, ?, ? )
  `).run(
    fromNodeNum,
    key,
    data,
    timestamp,
    device_id,
    connId
  );
}
import db from './dbschema.js';

export function insertConfig(subPacket) {
  const { fromNodeNum, key, data, timestamp, device_id, connId } = subPacket;

  db.prepare(`
    INSERT INTO config (
      num, type, payload, timestamp, device_id, conn_id
    ) VALUES ( ?, ?, ?, ?, ?, ? )
  `).run(
    fromNodeNum,
    key,
    data,
    timestamp,
    device_id,
    connId
  );
}
import db from './dbschema.js';

export function insertDeviceConfig(subPacket) {
  const { fromNodeNum, key, data, timestamp, device_id, connId } = subPacket;

  db.prepare(`
    INSERT INTO device_config (
      num, type, payload, timestamp, device_id, conn_id
    ) VALUES ( ?, ?, ?, ?, ?, ? )
  `).run(
    fromNodeNum,
    key,
    data,
    timestamp,
    device_id,
    connId
  );
}
// src/bridge/db/insertDeviceMeta.js

import db from './dbschema.js';

export function insertDeviceMeta({
  device_id,
  reboot_count,
  min_app_version,
  pio_env,
  firmware_version,
  hw_model,
  conn_id
}) {
  if (!device_id) {
    console.warn('[insertDeviceMeta] Skipped insert: missing device_id');
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO device_meta (
      device_id, reboot_count, min_app_version, pio_env,
      firmware_version, hw_model, conn_id, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s','now'))
  `);

  stmt.run(
    device_id,
    reboot_count,
    min_app_version,
    pio_env,
    firmware_version,
    hw_model,
    conn_id
  );
}
// src/bridge/db/insertDeviceSetting.js

import db from './dbschema.js';

export function insertDeviceSetting({ num, device_id, config_type, config_json, conn_id }) {
  if (!device_id || !config_type || !config_json) {
    console.warn('[insertDeviceSetting] Skipped insert: missing required fields', num, device_id, config_type, config_json);
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO device_settings (device_id, config_type, config_json, conn_id, updated_at)
    VALUES (?, ?, ?, ?, strftime('%s','now'))
    ON CONFLICT(device_id, config_type) DO UPDATE SET
    num         = excluded.num,
    config_json = excluded.config_json,
    conn_id     = excluded.conn_id,
    updated_at  = excluded.updated_at;

  `);

  stmt.run(device_id, config_type, config_json, conn_id);
}
import db from './dbschema.js';

export function insertDevice({ device_id, num, conn_id, device_type = 'meshtastic' }) {
  if (!device_id) {
    console.warn('[insertDevice] Skipped insert: missing device_id');
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO devices (device_id, num, conn_id, device_type, last_seen)
    VALUES (?, ?, ?, ?, strftime('%s','now'))
    ON CONFLICT(device_id) DO UPDATE SET
      num = excluded.num,
      conn_id = excluded.conn_id,
      device_type = excluded.device_type,
      last_seen = strftime('%s','now')
  `);

  stmt.run(device_id, num, conn_id, device_type);
}
// src/bridge/db/insertFileInfo.js

import db from './dbschema.js';

export function insertFileInfo(data) {

  const {filename, size, fromNodeNum, timestamp, connId, mime_type, description} = data;
  if (!filename || !size || !fromNodeNum) {
    console.warn('[insertFileInfo] Skipped insert: missing required fields', filename, size, fromNodeNum);
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO file_info (
      filename, size, mime_type, description,
      num, timestamp, conn_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    filename,
    size,
    mime_type || null,
    description || null,
    fromNodeNum,
    timestamp,
    connId || null
  );
}
import db from './dbschema.js';
import { insertNode } from './insertNodes.js';
import { insertNodeUsers } from './depreciated/InsertNodeUsers.js';
import { insertNodeMetrics } from './insertNodeMetrics.js';
import { insertUser } from './insertUsers.js';
import { insertDeviceMetrics } from './insertMetrics.js';
import { upsertNodeInfo } from './upsertNodeInfo.js';

// New device-centric inserts
import { insertConfig } from './insertConfig.js';
import { insertModuleConfig } from './insertModuleConfig.js';
import { insertDevice } from './insertDevices.js';
import { insertDeviceSetting } from './insertDeviceSettings.js';
import { insertDeviceMeta } from './insertDeviceMeta.js';
import { insertFileInfo } from './insertFileInfo.js';
import { insertPosition } from './insertPosition.js';   // <-- add this
import { insertMyInfo } from './insertMyInfo.js';
import { insertLogRecord } from './insertLogRecord..js';
import { insertMetadata } from './insertMetaData.js';

import { injectPacketLog, deleteNode } from './insertUtils.js';

export function upsertDeviceIpMap({ source_ip, num, device_id, last_seen }) {
  return db.prepare(`
    INSERT INTO device_ip_map (source_ip, num, device_id, last_seen)
    VALUES (@source_ip, @num, @device_id, @last_seen)
    ON CONFLICT(source_ip) DO UPDATE SET
      num = excluded.num,
      device_id = excluded.device_id,
      last_seen = excluded.last_seen
  `).run({ source_ip, num, device_id, last_seen });
}

// Retrieve mapping by IP
async function lookupDeviceIpMap(source_ip) {
  const row = await db.prepare(`
    SELECT num, device_id
    FROM device_ip_map
    WHERE source_ip = $source_ip
  `) .get({ source_ip });
  return row || null;
}

// --- Channels ---
export const insertChannel = (packet) => {

  db.prepare(`
    INSERT OR REPLACE INTO channels (
      channel_num, num, "index", name, role, psk,
      uplink_enabled, downlink_enabled, module_settings_json, timestamp
    ) VALUES (@channel_num, @num, @index, @name, @role, @psk,
      @uplink_enabled, @downlink_enabled, @module_settings_json, @timestamp)
  `).run({
    ...packet,
  });
};

// --- Messages ---
export const insertMessage = (msg) => {
  db.prepare(`
    INSERT INTO messages (message_id, channel_id, sender, content, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(msg.message_id, msg.channel_id, msg.sender, msg.content, msg.timestamp || Date.now());
};

// --- Connections ---
export const insertConnection = (conn) => {
  db.prepare(`
    INSERT OR REPLACE INTO connections (connection_id, num, transport, status)
    VALUES (?, ?, ?, ?)
  `).run(conn.connection_id, conn.num, conn.transport, conn.status);
};

// --- Packet Logs ---
// insertHandlers.js

export function insertPacketLog({ num, packet_type, timestamp, raw_payload }) {
  if (!num) {
    console.warn(`[insertPacketLog] Skipping log: no num provided`);
    return false;
  }

  const exists = db.prepare(`
    SELECT 1 FROM nodes WHERE num = ?
  `).get(num);

  if (!exists) {
    console.warn(`[insertPacketLog] Skipping log: no parent node for num=${num}`);
    return false;
  }

  db.prepare(`
    INSERT INTO packet_logs (
      num,
      packet_type,
      timestamp,
      raw_payload
    )
    VALUES (?, ?, ?, ?)
  `).run(num, packet_type, timestamp, raw_payload);

  return true;
}

// --- Telemetry ---
export const insertTelemetry = (tel) => {
  db.prepare(`
    INSERT INTO telemetry (fromNodeNum, toNodeNum, metric, value, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(tel.fromNodeNum, tel.toNodeNum, tel.metric, tel.value, tel.timestamp || Date.now());
};

// --- Events ---
export const insertEventEmission = (evt) => {
  db.prepare(`
    INSERT INTO event_emissions (num, event_type, details, timestamp)
    VALUES (?, ?, ?, ?)
  `).run(evt.num, evt.event_type, evt.details, evt.timestamp || Date.now());
};

// --- Metrics --
export const insertQueueStatus = (qs) => {
  db.prepare(`
    INSERT INTO queue_status (
      num, res, free, maxlen, mesh_packet_id, timestamp, conn_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run( qs.num, qs.res, qs.free, qs.maxlen, qs.mesh_packet_id || null, qs.timestamp || Date.now(), qs.conn_id || null );
};

// --- Aggregate all handlers ---
export const insertHandlers = {
  insertNode,
  insertNodeUsers,
  insertNodeMetrics,
  insertUser,
  insertConfig,
  insertModuleConfig,
  insertMyInfo,
  insertDeviceMetrics,
  insertChannel,
  insertMessage,
  insertConnection,
  insertPacketLog,
  insertTelemetry,
  insertEventEmission,
  insertFileInfo,
  insertLogRecord,
  insertQueueStatus,
  insertMetadata,
  upsertNodeInfo,

  // New device-centric handlers
  insertDevice,
  insertDeviceSetting,
  insertDeviceMeta,
  injectPacketLog,
  insertPosition,
  deleteNode,

  // mapping device_id handlers
  upsertDeviceIpMap,
  lookupDeviceIpMap
};
import db from './dbschema.js';

export function insertLogRecord(data) {
  const { message, decoded, fromNodeNum, timestamp, connId } = data;
console.log('...insertLogRecord decode', decoded);
  if (!message || typeof fromNodeNum !== 'number' || typeof timestamp !== 'number') {
    console.warn('[insertLogRecord] Skipped insert: missing required fields', {
      message,
      fromNodeNum,
      timestamp
    });
    return;
  }

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO log_records (
      num, packetType, rawMessage, timestamp, connId, decodeStatus
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    fromNodeNum,
    'logRecord',
    JSON.stringify(decoded),
    timestamp,
    connId || null,
    1
  );
}
import db from './dbschema.js';

export function insertMetadata(subPacket) {

  db.prepare(`
    INSERT INTO metadata (
      num, firmwareVersion, deviceStateVersion, canShutdown, hasWifi, hasBluetooth, hwModel, hasPKC, excludedModules
    ) VALUES (
     @num, @firmwareVersion, @deviceStateVersion, @canShutdown, @hasWifi, @hasBluetooth, @hwModel, @hasPKC, @excludedModules
    )
 `).run({
    ...subPacket,
  });
}
import db from './dbschema.js';

export function insertDeviceMetrics({
  fromNodeNum, toNodeNum, batteryLevel, txPower, uptime, cpuTemp, memoryUsage, timestamp
}) {
  db.prepare(`
    INSERT INTO device_metrics (
      fromNodeNum, toNodeNum, batteryLevel, txPower, uptime, cpuTemp, memoryUsage, timestamp
    ) VALUES (
      @fromNodeNum, @toNodeNum, @batteryLevel, @txPower, @uptime, @cpuTemp, @memoryUsage, @timestamp
    )
  `).run({
    fromNodeNum,
    toNodeNum,
    batteryLevel,
    txPower,
    uptime,
    cpuTemp,
    memoryUsage,
    timestamp
  });
}

export function insertEnvironmentMetrics({
  fromNodeNum, toNodeNum, temperature, humidity, pressure, lightLevel, timestamp
}) {
  db.prepare(`
    INSERT INTO environment_metrics (
      fromNodeNum, toNodeNum, temperature, humidity, pressure, lightLevel, timestamp
    ) VALUES (
      @fromNodeNum, @toNodeNum, @temperature, @humidity, @pressure, @lightLevel, @timestamp
    )
  `).run({
    fromNodeNum,
    toNodeNum,
    temperature,
    humidity,
    pressure,
    lightLevel,
    timestamp
  });
}

export function insertAirQualityMetrics({
  fromNodeNum, toNodeNum, pm25, pm10, co2, voc, ozone, timestamp
}) {
  db.prepare(`
    INSERT INTO air_quality_metrics (
      fromNodeNum, toNodeNum, pm25, pm10, co2, voc, ozone, timestamp
    ) VALUES (
      @fromNodeNum, @toNodeNum, @pm25, @pm10, @co2, @voc, @ozone, @timestamp
    )
  `).run({
    fromNodeNum,
    toNodeNum,
    pm25,
    pm10,
    co2,
    voc,
    ozone,
    timestamp
  });
}

export function insertPowerMetrics({
  fromNodeNum, toNodeNum, voltage, current, power, energy, frequency, timestamp
}) {
  db.prepare(`
    INSERT INTO power_metrics (
      fromNodeNum, toNodeNum, voltage, current, power, energy, frequency, timestamp
    ) VALUES (
      @fromNodeNum, @toNodeNum, @voltage, @current, @power, @energy, @frequency, @timestamp
    )
  `).run({
    fromNodeNum,
    toNodeNum,
    voltage,
    current,
    power,
    energy,
    frequency,
    timestamp
  });
}

export function insertLocalStats({
  fromNodeNum, toNodeNum, snr, rssi, hopCount, linkQuality, packetLoss, timestamp
}) {
  db.prepare(`
    INSERT INTO local_stats (
      fromNodeNum, toNodeNum, snr, rssi, hopCount, linkQuality, packetLoss, timestamp
    ) VALUES (
      @fromNodeNum, @toNodeNum, @snr, @rssi, @hopCount, @linkQuality, @packetLoss, @timestamp
    )
  `).run({
    fromNodeNum,
    toNodeNum,
    snr,
    rssi,
    hopCount,
    linkQuality,
    packetLoss,
    timestamp
  });
}

export function insertHealthMetrics({
  fromNodeNum, toNodeNum, cpuTemp, diskUsage, memoryUsage, uptime, loadAvg, timestamp
}) {
  db.prepare(`
    INSERT INTO health_metrics (
      fromNodeNum, toNodeNum, cpuTemp, diskUsage, memoryUsage, uptime, loadAvg, timestamp
    ) VALUES (
      @fromNodeNum, @toNodeNum, @cpuTemp, @diskUsage, @memoryUsage, @uptime, @loadAvg, @timestamp
    )
  `).run({
    fromNodeNum,
    toNodeNum,
    cpuTemp,
    diskUsage,
    memoryUsage,
    uptime,
    loadAvg,
    timestamp
  });
}

export function insertHostMetrics({
  fromNodeNum, toNodeNum, hostname, uptime, loadAvg, osVersion, bootTime, timestamp
}) {
  db.prepare(`
    INSERT INTO host_metrics (
      fromNodeNum, toNodeNum, hostname, uptime, loadAvg, osVersion, bootTime, timestamp
    ) VALUES (
      @fromNodeNum, @toNodeNum, @hostname, @uptime, @loadAvg, @osVersion, @bootTime, @timestamp
    )
  `).run({
    fromNodeNum,
    toNodeNum,
    hostname,
    uptime,
    loadAvg,
    osVersion,
    bootTime,
    timestamp
  });
}

export default {
  insertDeviceMetrics,
  insertEnvironmentMetrics,
  insertAirQualityMetrics,
  insertPowerMetrics,
  insertLocalStats,
  insertHealthMetrics,
  insertHostMetrics
};
import db from './dbschema.js';

export function insertModuleConfig(subPacket) {
  const { fromNodeNum, key, data, timestamp, device_id, connId } = subPacket;
console.log('...insertModuleConfig ', data);
  db.prepare(`
    INSERT INTO module_config (
      num, type, payload, timestamp, device_id, conn_id
    ) VALUES ( ?, ?, ?, ?, ?, ? )
  `).run(
    fromNodeNum,
    key,
    data,
    timestamp,
    device_id,
    connId
  );
}
import db from './dbschema.js';
import { setMapping } from '../core/connectionManager.js';

export async function insertMyInfo(packet) {

  const { myNodeNum, deviceId, currentIP } = packet;

  setMapping(currentIP, myNodeNum, deviceId);

  if (!myNodeNum || !deviceId) {
    console.warn('[insertMyInfo] Missing required fields:', { myNodeNum, deviceId });
    return;
  }
  try {
    await db.prepare(
      `INSERT INTO my_info (
        myNodeNum, deviceId, rebootCount, minAppVersion, pioEnv, currentIP, connId, timestamp
      ) VALUES (@myNodeNum, @deviceId, @rebootCount, @minAppVersion, @pioEnv, @currentIP, @connId, @timestamp)
      ON CONFLICT(myNodeNum) DO UPDATE SET
        deviceId = excluded.deviceId,
        rebootCount = excluded.rebootCount,
        minAppVersion = excluded.minAppVersion,
        pioEnv = excluded.pioEnv,
        currentIP = excluded.currentIP,
        connId = excluded.connId,
        timestamp = excluded.timestamp`
    ).run({
        ...packet,
        timestamp: Date.now(),
    })
  } catch (err) {
    console.error('[insertMyInfo] DB insert failed:', err);
  }
}
import db from './dbschema.js';

/**
 * Inserts or updates a node's runtime metrics into node_metrics.
 *
 * @param {Object} deviceMetrics - The metrics object from NodeInfo
 * @param {Object} options - { num: nodeNum, lastHeard?: number }
 */
export function insertNodeMetrics(deviceMetrics, { num, lastHeard = Date.now() }) {


  db.prepare(`
    INSERT INTO node_metrics (
      nodeNum, lastHeard, metrics, updatedAt
    ) VALUES (
      @nodeNum, @lastHeard, @metrics, @updatedAt
    )
    ON CONFLICT(nodeNum) DO UPDATE SET
      lastHeard = excluded.lastHeard,
      metrics = excluded.metrics,
      updatedAt = excluded.updatedAt
  `).run({
    nodeNum: num,
    lastHeard,
    metrics: JSON.stringify(deviceMetrics),
    updatedAt: Date.now()
  });
}
import db from './dbschema.js';

export const insertNode = (node, timestamp = Date.now()) => {
  if (!node?.num) {
    console.warn('[insertNode] Skipping insert: node.num is missing');
    return;
  }

  db.prepare(`
    INSERT INTO nodes (
      num,
      label,
      last_seen,
      viaMqtt,
      hopsAway,
      lastHeard
    )
    VALUES (
      @num,
      @label,
      @last_seen,
      @viaMqtt,
      @hopsAway,
      @lastHeard
    )
    ON CONFLICT(num) DO UPDATE SET
      label = excluded.label,
      last_seen = excluded.last_seen,
      viaMqtt = excluded.viaMqtt,
      hopsAway = excluded.hopsAway,
      lastHeard = excluded.lastHeard
  `).run({
    num: node.num,
    label: node.label ?? null,
    last_seen: node.last_seen ?? timestamp,
    viaMqtt: node.viaMqtt ? 1 : 0,
    hopsAway: node.hopsAway ?? null,
    lastHeard: node.lastHeard ?? null
  });
};
import db from './dbschema.js';

export function insertPosition({ fromNodeNum, toNodeNum, latitude, longitude, altitude, timestamp }) {
  const ts = timestamp ?? Date.now();

  // Upsert current state in nodes
  db.prepare(`
    INSERT INTO nodes (num, latitude, longitude, altitude, last_seen)
    VALUES (@num, @latitude, @longitude, @altitude, @ts)
    ON CONFLICT(num) DO UPDATE SET
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      altitude = excluded.altitude,
      last_seen = excluded.last_seen
  `).run({
    num: fromNodeNum,
    latitude: Number(latitude),
    longitude: Number(longitude),
    altitude: altitude != null ? Number(altitude) : null,
    ts
  });

  // Append to positions log
  db.prepare(`
    INSERT INTO positions (fromNodeNum, toNodeNum, latitude, longitude, altitude, timestamp)
    VALUES (@fromNodeNum, @toNodeNum, @latitude, @longitude, @altitude, @ts)
  `).run({
    fromNodeNum,
    toNodeNum,
    latitude: Number(latitude),
    longitude: Number(longitude),
    altitude: altitude != null ? Number(altitude) : null,
    ts
  });
}
import db from './dbschema.js';

export const insertUser = (user, nodeNum = null, { dryRun = false } = {}) => {
  if (!user?.id) {
    console.warn('[insertUser] Skipping insert: user.id is missing');
    return;
  }

  const payload = {
    id: user.id,
    longName: user.longName ?? null,
    shortName: user.shortName ?? null,
    macaddr: user.macaddr ?? null,
    hwModel: user.hwModel ?? null,
    publicKey: user.publicKey ?? null,
    isUnmessagable: user.isUnmessagable ? 1 : 0,
    nodeNum
  };

  if (dryRun) {
    console.log('[insertNodeUser] Dry-run insert:', payload);
    return;
  }

  db.prepare(`
    INSERT INTO node_users (
      id,
      longName,
      shortName,
      macaddr,
      hwModel,
      publicKey,
      isUnmessagable,
      nodeNum
    )
    VALUES (
      @id,
      @longName,
      @shortName,
      @macaddr,
      @hwModel,
      @publicKey,
      @isUnmessagable,
      @nodeNum
    )
    ON CONFLICT(id) DO UPDATE SET
      longName = excluded.longName,
      shortName = excluded.shortName,
      macaddr = excluded.macaddr,
      hwModel = excluded.hwModel,
      publicKey = excluded.publicKey,
      isUnmessagable = excluded.isUnmessagable,
      nodeNum = excluded.nodeNum
  `).run(payload);
};
import db from './dbschema.js';
import { insertHandlers } from './depreciated/insertHandlers_old.js'

/**
 * Upserts a full nodeInfo payload into nodes, node_users, and node_metrics.
 * Runs in a single transaction for atomicity.
 *
 * @param {Object} nodeInfo - The decoded NodeInfo object
 * @returns {Object} - { num } for downstream inserts
 */
export const upsertNodeInfo = (nodeInfo) => {
  const num = nodeInfo?.num;

  if (!num) {
    console.warn('[upsertNodeInfo] Skipping: nodeInfo.num is missing', nodeInfo);
    return null;
  }

  const tx = db.transaction(() => {
    // Insert into nodes table
    insertHandlers.insertNode({
      num,
      label: nodeInfo.user?.longName ?? null,
      last_seen: nodeInfo.lastHeard ?? Date.now(),
      viaMqtt: nodeInfo.viaMqtt,
      hopsAway: nodeInfo.hopsAway,
      lastHeard: nodeInfo.lastHeard
    });

    // Insert into node_users table
    if (nodeInfo.user) {
      insertHandlers.insertNodeUsers(nodeInfo.user, num);
    }

    // Insert into node_metrics table
    if (nodeInfo.deviceMetrics) {
      insertHandlers.insertNodeMetrics(nodeInfo.deviceMetrics, {
        num,
        lastHeard: nodeInfo.lastHeard
      });
    }
  });

  tx();
  return { num };
};
