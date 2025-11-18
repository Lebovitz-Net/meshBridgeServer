// --- Misc Inserts ---
import db from '../db.js';
import { emitMessageUpdate } from '../../Meshtastic/utils/sseEmitters.js';

// --- Messages ---
export const insertMessage = (msg) => {
  db.prepare(`
    INSERT INTO messages (
      contactId, messageId, channelId, fromNodeNum, toNodeNum,
      message, recvTimestamp,
      sentTimestamp, protocol, sender, mentions, options
    )
    VALUES (
      @contactId, @messageId, @channelId, @fromNodeNum, @toNodeNum,
      @message, @recvTimestamp,
      @sentTimestamp, @protocol, @sender, @mentions, @options    
    )
  `).run({
    ...msg,
  });

  emitMessageUpdate({
    ...msg,
    timestamp: msg.timestamp ?? Date.now()
  });
};
