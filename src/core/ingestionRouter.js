import { decodeFromRadioPacket } from '../packets/decodeFromRadioPacket.js';
import { dispatchSubPacket } from './dispatchSubPacket.js';
import { decodeAndNormalize } from '../packets/packetDecoders.js';
import { getMapping } from './connectionManager.js';

const FROM_RADIO_ONEOFS = new Set([
  'packet',
  'myInfo',
  'nodeInfo',
  'config',
  'logRecord',
  'configCompleteId',
  'rebooted',
  'moduleConfig',
  'channel',
  'queueStatus',
  'xmodemPacket',
  'metadata',
  'mqttClientProxyMessage',
  'fileInfo',
  'clientNotification',
  'deviceuiConfig'
]);

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

    for (const [key, value] of Object.entries(data)) {
      if (value == null || !FROM_RADIO_ONEOFS.has(key)) {
        continue;
      }

      const effective = decodeFromRadioPacket(key, value, {
        ...meta,
        ...enrichMeta(value, meta),
      });

      if (effective) {
        dispatchSubPacket(effective);
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
