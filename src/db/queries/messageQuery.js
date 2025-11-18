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
export const listAllMessages = (limit = 500) => {
  return db.prepare(`
    SELECT messageId, channelId, fromNodeNum, toNodeNum,
      message, recvTimestamp,
      sentTimestamp, protocol, sender, mentions, options
    FROM messages
    ORDER BY sentTimestamp DESC
    LIMIT ?
  `).all(limit);
};
