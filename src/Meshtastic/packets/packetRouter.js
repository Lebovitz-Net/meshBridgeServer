import { processPacket } from './processPacket.js';
import { dispatchPacket } from '../routing/dispatchPacket.js';
import { decodePacket } from './packetDecode.js';
import { getMapping } from '../routing/nodeMapping.js';
import { getProtobufTypes } from '../utils/protoUtils.js';

// --- Meta Enrichment ---

function enrichMeta(value = {}, meta = {}) {
  const ts = Number(Date.now());
  const mapping = getMapping(meta.sourceIp);

  return {
    ...meta,
    timestamp: ts,
    fromNodeNum: value.from || meta.fromNodeNum || value.fromNodeNum || mapping?.num,
    toNodeNum: value.to || meta.toNodeNum || value.toNodeNum || 0xffffffff,
    device_id: meta.sourceIp || mapping?.device_id
  };
}

/**
 * Main entry point for decoded packet ingestion.
 * Decomposes into subpackets, delegates decoding,
 * enriches with context, and dispatches each to its handler.
 *
 * @param {Object|Buffer} input - Either a raw buffer or a pre-decoded FromRadio object
 * @param {Object} meta - Transport context (sourceIp, connId, device_id, etc.)
 */
export function routePacket(input, meta = {}) {
  let diagPacket = null;
  try {
    const ts = Number(Date.now());
    const connId = meta.connId;
    const mapping = getMapping(meta.sourceIp);

    const data = Buffer.isBuffer(input)
      ? decodePacket(input, meta.source, meta.connId)
      : input;

    // if (data.type === 'User') {console.log([...input].map(b => b.toString(16).padStart(2,'0')).join(' '));}

    const oneofs = getProtobufTypes(data.type);

    if (!data || data.type === 'Unknown') {
      return;
    }
    if (oneofs) {
      for (const [key, value] of Object.entries(data)) {
        if (value == null) {
          continue;
        }

        if (!oneofs.has(key))
          continue;

        diagPacket = data;
        dispatchPacket({ type: key, data, meta: enrichMeta(value, meta) });
      }
    } else {
      diagPacket = data;
      dispatchPacket({ type: data.type, data, meta: enrichMeta(data, meta) });
    }
  } catch (err) {
    console.error('[routePacket] Failed to route packet:', err, diagPacket);
  }
}

export default {
  routePacket,
  getMapping,
};
