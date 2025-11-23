import db from '../db.js';

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
