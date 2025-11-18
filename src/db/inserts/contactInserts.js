import db from '../../db/db.js';
// insertNodeUsers ===========================================
export function insertUsers(user) {
  db.prepare(`
    INSERT INTO users (
      contactId, type, name, publicKey, timestamp, protocol, connId,
      nodeNum, shortName,         -- Meshtastic
      times, options, position   -- Protocol Specific
    ) VALUES (
      @contactId, @type, @name, @publicKey, @timestamp, @protocol, @connId,
      @nodeNum, @shortName,                             
      @times, @options, @position                       
    )
    ON CONFLICT(contactId) DO UPDATE SET
      name = excluded.name,
      shortName = excluded.shortName,
      publicKey = excluded.publicKey
  `).run({
    ...user,
  });
}
