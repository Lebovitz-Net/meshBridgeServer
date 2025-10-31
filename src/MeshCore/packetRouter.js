// MeshCore/packetRouter.js

const handlers = {};

/**
 * Register a handler for a specific payload type or opcode.
 * @param {string} key - e.g., 'REQ', 'ADVERT', 'WANT_CONFIG'
 * @param {function} handler - (packet, meta) => void
 */
export function register(key, handler) {
  if (!key || typeof handler !== 'function') {
    throw new Error('Invalid handler registration');
  }
  handlers[key] = handler;
}

/**
 * Dispatch a decoded Packet to the appropriate handler.
 * @param {Packet} packet - Parsed Packet instance
 * @param {object} meta - Metadata (e.g., source, timestamp)
 */
export function dispatch(packet, meta = {}) {
  const type = packet.payload_type_string;

  // First dispatch by payload type
  if (handlers[type]) {
    return handlers[type](packet, meta);
  }

  // Optionally dispatch by opcode inside payload
  const parsed = packet.parsePayload?.();
  const opcode = parsed?.opcode || extractOpcode(parsed?.encrypted);

  if (opcode && handlers[opcode]) {
    return handlers[opcode](packet, meta);
  }

  console.warn(`[Router] No handler for packet type: ${type} or opcode: ${opcode}`);
}

// 🔹 Optional: extract opcode from encrypted blob
function extractOpcode(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;
  return OPCODE_LOOKUP[buffer[0]];
}

// 🔹 Known opcodes (expand as needed)
const OPCODE_LOOKUP = {
  0x01: 'WANT_CONFIG',
  0x02: 'SEND_NODE_INFO',
  0x03: 'SUBSCRIBE',
  0x04: 'UNSUBSCRIBE'
};
