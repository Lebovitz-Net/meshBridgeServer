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
