// --- Misc Inserts ---
import db from '../db.js';
import { emitMessageUpdate } from '../../Meshtastic/utils/sseEmitters.js';

// --- Messages ---
export const insertMessage = (msg) => {
  db.prepare(`
    INSERT INTO messages (
      messageId, channelId, fromNodeNum, toNodeNum,
      message, wantAck, wantReply, replyId, recvTimestamp,
      sendTimestate, protocol, sender, mentions, flags, routing
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    msg.messageId,
    msg.channelId,
    msg.fromNodeNum,
    msg.toNodeNum,
    msg.message,
    msg.wantAck ? 1 : 0,
    msg.wantReply ? 1 : 0,
    msg.replyId,
    msg.recvTimestamp ?? Date.now(),
    msg.sendTimestamp,
    msg.protocol ?? 'meshtastic',
    msg.sender ?? null,
    JSON.stringify(msg.mentions ?? []),
    JSON.stringify(msg.flags ?? {}),
    JSON.stringify(msg.routing ?? {})
  );

  emitMessageUpdate({
    ...msg,
    timestamp: msg.timestamp ?? Date.now()
  });
};
