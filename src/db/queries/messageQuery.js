import db from '../db.js';

// --- Message Queries ---

// Channel-scoped messages
export const listMessagesForChannel = (channelId, limit = 100) => {
  return db.prepare(`
    SELECT messageId, channelId, fromNodeNum, toNodeNum,
      message, recvTimestamp,
      sentTimestamp, protocol, sender, mentions, options
    FROM messages
    WHERE channelId = ?
    ORDER BY sentTimestamp DESC
    LIMIT ?
  `).all(channelId, limit);
};

// Unified messages across all channels
// Unified messages query with optional filters
// Unified messages query with optional filters
export const listMessages = ({ channelId = null, sinceDate = 0, limit = 500 } = {}) => {
  const sql = [
    `SELECT messageId, channelId, fromNodeNum, toNodeNum,
            message, recvTimestamp,
            sentTimestamp, protocol, sender, mentions, options
     FROM messages
     WHERE 1=1`,
    channelId !== null && `AND channelId = ?`,
    sinceDate > 0 && `AND recvTimestamp > ?`,
    `ORDER BY recvTimestamp DESC LIMIT ?`
  ].filter(Boolean).join(' ');

  const params = [
    ...(channelId !== null ? [channelId] : []),
    ...(sinceDate > 0 ? [sinceDate] : []),
    limit
  ];

  return db.prepare(sql).all(...params);
};
