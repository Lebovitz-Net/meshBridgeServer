// schemaValidator.js
// Validates subpacket structure before dispatch

/**
 * Basic schema definitions for known subpacket types.
 * Each entry defines required fields and optional type checks.
 */
const schemaDefinitions = {
  nodeInfo: {
    required: ['num', 'user', 'hwModel'],
  },
  logRecord: {
    required: ['level', 'message'],
  },
  configCompleteId: {
    required: ['id'],
  },
  // 🧩 Extend with more subtypes as needed
};

/**
 * Validate a subpacket against its schema definition.
 *
 * @param {Object} subPacket - The enriched subpacket object
 * @returns {boolean} - True if valid, false otherwise
 */
export function validateSubPacket(subPacket) {
  if (!subPacket || !subPacket.type) {
    console.warn('[schemaValidator] Missing type in subPacket');
    return false;
  }

  const schema = schemaDefinitions[subPacket.type];
  if (!schema) {
    // Unknown type → allow through but log
    console.warn(`[schemaValidator] No schema defined for type: ${subPacket.type}`);
    return true;
  }

  const { required } = schema;
  for (const field of required) {
    if (subPacket.data?.[field] === undefined) {
      console.warn(`[schemaValidator] Missing required field "${field}" in ${subPacket.type}`);
      return false;
    }
  }

  return true;
}
