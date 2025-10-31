// --- Misc Inserts ---
import db from '../db.js';
import { emitMessageUpdate } from '../../Meshtastic/utils/sseEmitters.js';


// --- Messages ---
export const insertMessage = (msg) => {
  db.prepare(`
    INSERT INTO messages (messageId, channelId, fromNodeNum, toNodeNum, 
                message, wantAck, wantReply, replyId, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(msg.messageId, msg.channelId, msg.fromNodeNum, msg.toNodeNum, 
         msg.message, msg.wantAck = msg.wantAct ?  1 : 0, msg.wantReply = msg.wantReply ? 1 : 0, 
         msg.replyId, msg.timestamp);

    emitMessageUpdate({
      ...msg,
      timestamp: msg.timestamp ?? Date.now()
    });
};
