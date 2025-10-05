// --- Misc Inserts ---
import db from '../db.js';

// --- Messages ---
export const insertMessage = (msg) => {
  
  db.prepare(`
    INSERT INTO messages (messageId, channelId, fromNodeNum, toNodeNum, 
                message, wantAck, wantReply, replyId, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(msg.message_id, msg.channel, msg.fromNodeNum, msg.toNodeNum, 
         msg.message, msg.wantAck, msg.wantReply, msg.replyId, msg.timestamp);
};
