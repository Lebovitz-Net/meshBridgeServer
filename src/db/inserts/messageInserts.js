// --- Misc Inserts ---
import db from '../db.js';

// --- Messages ---
export const insertMessage = (msg) => {
  
  db.prepare(`
    INSERT INTO messages (messageId, channelId, fromNodeNum, toNodeNum, 
                message, wantAck, wantReply, replyId, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(msg.messageid, msg.channelNum, msg.fromNodeNum, msg.toNodeNum, 
         msg.payload, msg.wantAck = msg.wantAct ?  1 : 0, msg.wantReply = msg.wantReply ? 1 : 0, 
         msg.replyId, msg.timestamp);
};
