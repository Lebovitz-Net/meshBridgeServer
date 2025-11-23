// --- Misc Inserts ---
import db from '../db.js';
import { emitMessageUpdate } from '../../servers/sseEmitters.js';
import { normalizeIn } from '../../utils.js';

// --- Messages ---
export const insertMessage = (msg) => {
  const { recvTimestamp, sentTimestamp } = msg;

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
    recvTimestamp: normalizeIn(recvTimestamp),
    sentTimestamp: normalizeIn(sentTimestamp), 
  });

  emitMessageUpdate({
    ...msg,
    timestamp: msg.timestamp ?? Date.now()
  });
};
