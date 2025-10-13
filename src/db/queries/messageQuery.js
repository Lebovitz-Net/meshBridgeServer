import db from '../db.js';

// --- Message Queries ---
export const listMessagesForChannel = (channelId, limit = 100) => {
  return db.prepare(`
    SELECT messageId, channelId, fromNodeNum, toNodeNum, 
           message, wantAck, wantReply, replyId, timestamp
    FROM messages
    WHERE channelId = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(channelId, limit);
};

export const listExtendedMessagesForChannel = (channelId, limit = 100) => {
  return db.prepare(
    `SELECT
      -- messages table
      m.messageId,
      m.fromNodeNum,
      m.toNodeNum,
      m.channelId,
      m.sender,
      m.message,
      m.replyId,
      m.wantReply,
      m.wantAck,
      m.viaMqtt,
      m.timestamp,

      -- node_users table
      nu.nodeNum       AS userNodeNum,
      nu.userId,
      nu.longName,
      nu.shortName,
      nu.macaddr,
      nu.hwModel,
      nu.publicKey,
      nu.isUnmessagable,
      nu.updatedAt
    FROM
      messages m
    LEFT JOIN
      node_users nu ON m.fromNodeNum = nu.nodeNum
    WHERE
      m.channelId = ?
    ORDER BY
      m.timestamp DESC
    LIMIT ?`
  ).all(channelId, limit);
};
