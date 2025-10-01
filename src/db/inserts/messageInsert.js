// --- Misc Inserts ---
import db from '../dbschema.js';


export const insertMessage = (message) => {
  const stmt = db.prepare(`
    INSERT INTO messages (message_id, channel_id, sender, content, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(message.message_id, message.channel_id, message.sender, message.content, message.timestamp);
};
