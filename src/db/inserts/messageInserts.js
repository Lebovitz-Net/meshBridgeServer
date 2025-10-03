// --- Misc Inserts ---
import db from '../dbschema.js';

// --- Messages ---
export const insertMessage = (msg) => {
  db.prepare(`
    INSERT INTO messages (message_id, channel_id, fromNodeNum, toNodeNum, message, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(msg.message_id, msg.channel, msg.fromNodeNum, msg.toNodeNum, msg.message, msg.timestamp || Date.now());
};
