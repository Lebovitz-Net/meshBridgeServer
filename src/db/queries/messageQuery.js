import db from '../dbschema.js';

// --- Message Queries ---
export const listMessagesForChannel = (channel_id, limit = 50) => {
  return db.prepare(`
    SELECT message_id, fromNodeNum, message, timestamp
    FROM messages
    WHERE channel_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(channel_id, limit);
};
