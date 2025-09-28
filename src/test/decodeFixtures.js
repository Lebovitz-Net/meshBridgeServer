// test/helpers/decodeFixture.js
// Utility to run a fixture through the full ingestion pipeline

import { decodeAndNormalize } from '../../src/packets/packetDecoders.js';
import { normalizeDecodedPacket } from '../../src/packets/packetUtils.js';
import { validateSubPacket } from '../../src/router/schemaValidator.js';
import { dispatchSubPacket } from '../../src/router/dispatchSubPacket.js';
import protoJson from '../../src/proto/proto.json' assert { type: 'json' };

/**
 * Decode a fixture buffer, normalize, validate, and optionally dispatch.
 *
 * @param {Buffer} raw - The raw encoded buffer
 * @param {Object} meta - Metadata (connId, sourceIp, etc.)
 * @param {boolean} [dispatch=false] - Whether to dispatch the subpackets
 * @returns {Object[]} - Array of validated subpackets
 */
export function decodeFixture(raw, meta = {}, dispatch = false) {
  const decoded = decodeAndNormalize(raw, meta.connId || 'testConn', meta.sourceIp || '127.0.0.1');
  const subPackets = normalizeDecodedPacket(decoded, protoJson);

  const validSubPackets = [];
  for (const sp of subPackets) {
    if (validateSubPacket(sp)) {
      if (dispatch) {
        dispatchSubPacket(sp);
      }
      validSubPackets.push(sp);
    }
  }

  return validSubPackets;
}
