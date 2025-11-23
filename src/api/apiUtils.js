import crypto from 'crypto';

// Small helper to wrap sync handlers in try/catch
export const safe = (fn) => (req, res) => {
  try {
    fn(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


/**
 * Generates a unique message ID based on key packet fields.
 * Ensures reproducibility and avoids collisions across protocols.
 */

export const generateMessageId = (packet) => {
  const base = [
    packet.protocol ?? 'meshcore',
    packet.sender,
    packet.channel ?? 'default',
    packet.timestamp ?? Date.now(),
    packet.text ?? packet.message
  ].join('|');
  return crypto.createHash('sha256').update(base).digest('hex').slice(0, 16); // 16-char ID
};

// --- Utility: Extract sender and mentions from message string ---
export const extractSenderAndMentions = (msg) => {
  const splitIndex = msg.indexOf(':');
  if (splitIndex === -1) {
    return { sender:null, message: msg, mentions: null};
  }

  const sender  = msg.slice(0, splitIndex).trim().toLowerCase();
  const message = msg.slice(splitIndex + 1).trim();

  const mentionMatches = [...message.matchAll(/@(\w+)/g)].map(m => m[1].toLowerCase());
  const mentions = [...new Set(mentionMatches)];

  return { sender, message, mentions };
};
