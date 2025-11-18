import db from '../db.js';
import { setMapping, setChannelMapping } from '../../Meshtastic/routing/nodeMapping.js';

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
// move this to nodes.

export async function insertMyInfo(packet) {
  
  const { myNodeNum, deviceId, currentIP, channel} = packet;

  if (!myNodeNum || !currentIP) {
    console.warn('[insertMyInfo] Missing required fields:', { myNodeNum, currentIP }, packet);
    return;
  }

  setMapping(currentIP, myNodeNum, currentIP);
  setChannelMapping(channel ?? 0, myNodeNum);
/*
      myNodeNum INTEGER PRIMARY KEY,  -- hash from primaryKey in meshcore
      type INTEGER DEFAULT 0,         -- type
      options TEXT,                   -- deviceId, RebootCount, minAppVersion, pioEnv, 
                                      -- radioFreq, radioBw, radioSf, radioCr, txPower, maxTxPower
                                      -- advLat, advLon manualAddContact       
      publicKey TEXT,
      protocol INTEGER,               -- 0 Meshtastic, 1 Meshcore
      currentIP TEXT,
      connId TEXT,
      timestamp INTEGER
*/
  try {
    db.prepare(
      `INSERT INTO my_info (
        myNodeNum, name, type, options, publicKey, protocol, currentIP, connId, timestamp
      ) VALUES (@myNodeNum, @name, @type, @options, @publicKey, @protocol, @currentIP, @connId, @timestamp)
      ON CONFLICT(myNodeNum) DO UPDATE SET
        publicKey = excluded.publicKey,
        currentIP = excluded.currentIP,
        connId = excluded.connId,
        timestamp = excluded.timestamp`
    ).run({
        ...packet,
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
