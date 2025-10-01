import db from './dbschema.js';
import { insertNode } from './insertNodes.js';
import { insertNodeUsers } from './InsertNodeUsers.js';
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
