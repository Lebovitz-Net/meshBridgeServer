import db from '../db.js';
import { setMapping, setChannelMapping } from '../../core/nodeMapping.js';

// insertConfig ============================================================

export function insertConfig(subPacket) {
  const { fromNodeNum, key, data, timestamp, device_id, connId } = subPacket;

  db.prepare(`
    INSERT INTO config (
      num, type, payload, timestamp, device_id, conn_id
    ) VALUES ( ?, ?, ?, ?, ?, ? )
  `).run( fromNodeNum, key, data, timestamp, device_id, connId );
}

// insertModuleConfig =======================================================

export function insertModuleConfig(subPacket) {
  const { fromNodeNum, key, data, timestamp, device_id, connId } = subPacket;

  db.prepare(`
    INSERT INTO module_config (
      num, type, payload, timestamp, device_id, conn_id
    ) VALUES ( ?, ?, ?, ?, ?, ? )
  `).run( fromNodeNum, key, data, timestamp, device_id, connId );
}

// InsertMyInfo ==============================================================

export async function insertMyInfo(packet) {
  
  const { myNodeNum, deviceId, currentIP, channel} = packet;

  if (!myNodeNum || !deviceId) {
    console.warn('[insertMyInfo] Missing required fields:', { myNodeNum, deviceId }, packet);
    return;
  }

  setMapping(currentIP, myNodeNum, deviceId);
  setChannelMapping(channel ?? 0, myNodeNum);

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
        deviceId: deviceId | currentIP,
        connId: packet.connId ?? null,
        timestamp: Date.now(),
    })
  } catch (err) {
    console.error('[insertMyInfo] DB insert failed:', err);
  }
}

// insertConnection ============================================================================

export const insertConnection = (connection) => {
  const stmt = db.prepare(`
    INSERT INTO connections (connection_id, num, transport, status)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(connection.connection_id, connection.num, connection.transport, connection.status);
};

// insertFileInfo=========================================================

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

  stmt.run( filename, size, mime_type || null, description || null, fromNodeNum, timestamp, connId || null );
}

// insertMetadata==================================================================

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
