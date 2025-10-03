import db from '../dbschema.js';

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
