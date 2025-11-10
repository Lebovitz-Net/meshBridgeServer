// --- Misc Inserts ---
import db from '../db.js';
import { emitMessageUpdate } from '../../Meshtastic/utils/sseEmitters.js';

// --- Messages ---
export const insertMessage = (msg) => {
  db.prepare(`
    INSERT INTO messages (
      messageId, channelId, fromNodeNum, toNodeNum,
      message, recvTimestamp,
      sentTimestamp, protocol, sender, mentions, options
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    msg.messageId,
    msg.channelId,
    msg.fromNodeNum,
    msg.toNodeNum,
    msg.message,
    msg.recvTimestamp ?? Date.now(),
    msg.sentTimestamp,
    msg.protocol ?? 'meshtastic',
    msg.sender ?? null,
    JSON.stringify(msg.mentions ?? []),
    JSON.stringify(msg.options ?? {})
  );

  emitMessageUpdate({
    ...msg,
    timestamp: msg.timestamp ?? Date.now()
  });
};
