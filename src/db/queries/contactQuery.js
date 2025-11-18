import db from '../db.js';

/**
 * List all contacts from the users table.
 * Returns enriched contact info including nodeNum, names, publicKey, options, position, etc.
 */
export function listContacts(limit = 500) {
  return db.prepare(`
    SELECT
      contactId,
      type,
      name,
      publicKey,
      timestamp,
      protocol,
      nodeNum,
      shortName,
      times,
      options,
      position,
      connId
    FROM users
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(limit);
}
