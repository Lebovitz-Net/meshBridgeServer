import db from '../db.js';

// --- Message Queries ---
export const listMessagesForChannel = (channel_id, limit = 50) => {
  return db.prepare(`
    SELECT messageId, channelId, fromNodeNum, toNodeNum, 
           message, wantAck, wantReply, replyId, timestamp
    FROM messages
    WHERE channelId = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(channelId, limit);
};
