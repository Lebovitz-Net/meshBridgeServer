import { processPacket } from '../packets/processPacket.js';
import { dispatchPacket } from './dispatchPacket.js';
import { decodeAndNormalize } from '../packets/packetCodecs.js';
import { getMapping } from './nodeMapping.js';
import { 
  FROM_RADIO_ONEOFS, 
  CONFIG_ONEOFS, 
  MODULE_CONFIG_ONEOFS, 
  ADMIN_MESSAGE_ONEOFS, 
  CLIENT_NODIFICATION_ONEOFS 
} from '../utils/oneofsUtil.js';

// --- Meta Enrichment ---

function enrichMeta(value = {}, meta = {}) {
  const ts = Number(Date.now());
  const mapping = getMapping(meta.sourceIp);

  return {
    ...meta,
    connId: meta.connId || meta.sourceIp | 'unknown',
    timestamp: ts,
    fromNodeNum: value.fromNodeNum || value.num || mapping?.num,
    toNodeNum: value.toNodeNum,
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
  try {
    const ts = Number(Date.now());
    const connId = meta.connId || meta.sourceIp || 'unknown';
    const mapping = getMapping(meta.sourceIp);

    const data = Buffer.isBuffer(input)
      ? decodeAndNormalize(input)
      : input;

    if (!data) {
      console.warn('[IngestionRouter] No decoded data object provided');
      return;
    }

    if (Object)
    for (const [key, value] of Object.entries(data)) {

      // if (value && key !== 'packet' && key !== 'nodeInfo' && (ADMIN_MESSAGE_ONEOFS.has(key)
      //     || CONFIG_ONEOFS.has(key) || MODULE_CONFIG_ONEOFS.has(key)
      //     || CLIENT_NODIFICATION_ONEOFS.has(key)
      //     || FROM_RADIO_ONEOFS.has(key))) {
      //   console.log('[routePacket', key, { value });
      // }

      if (value == null || !FROM_RADIO_ONEOFS.has(key)) {
        continue;
      }

      const effective = processPacket(key, value, {
        ...meta,
        ...enrichMeta(value, meta),
      });

      if (effective) {
        dispatchPacket(effective);
      } else {
        console.warn(`[IngestionRouter] Failed to decode subtype: ${key}`);
      }
    }
  } catch (err) {
    console.error('[IngestionRouter] Failed to route packet:', err);
  }
}

export default {
  routePacket,
  getMapping,
};
