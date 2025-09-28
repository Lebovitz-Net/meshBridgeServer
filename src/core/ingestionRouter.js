// core/ingestionRouter.js
import { decodeFromRadioPacket } from '../packets/decodeFromRadioPacket.js';
import { decodeMeshPacket } from '../packets/decodeMeshPacket.js'; // ✅ renamed
import { dispatchSubPacket } from './dispatchSubPacket.js';
import { insertHandlers } from '../db/insertHandlers.js';
import { decodeAndNormalize } from '../packets/packetDecoders.js';
import { getMapping } from './connectionManager.js';
import { decodeSubPacket } from '../packets/decodeSubPacket.js';

const { upsertDeviceIpMap, getAllDeviceIpMappings } = insertHandlers;

// Known oneofs/subtypes on FromRadio messages.
// Keep this list in sync with your proto definitions.
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

/**
 * Main entry point for decoded packet ingestion.
 * Decomposes into subpackets, decodes MeshPacket/FromRadio,
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
      if (value == null) continue;
      if (!FROM_RADIO_ONEOFS.has(key)) continue; // ✅ only process known oneofs

      if (key === 'packet') {
        const decoded = decodeMeshPacket(value);
        if (decoded) {
          dispatchSubPacket({
            ...decoded,
            connId,
            timestamp: ts,
            fromNodeNum: decoded.fromNodeNum ?? value?.from ?? mapping?.num ?? null,
            toNodeNum: decoded.toNodeNum ?? value?.to ?? null,
            device_id: meta.sourceIp || mapping?.device_id,
            sourcePacket: 'packet',
          });
        } else {
          console.warn('[IngestionRouter] Failed to decode MeshPacket');
        }
      } else {
        const basePacket = {
          type: key,
          data: value,
          connId,
          timestamp: meta.timestamp || ts,
          fromNodeNum: data.fromNodeNum || value?.num || meta.fromNodeNum || mapping?.num ||  null,
          toNodeNum: data.toNodeNum || null,
          device_id: meta.sourceIp || mapping?.device_id || meta.device_id || null,
        };

        const effective = decodeFromRadioPacket(basePacket);
        if (effective) {
          dispatchSubPacket(effective);
        } else {
          console.warn(`[IngestionRouter] Unhandled FromRadio subtype: ${key}`);
        }
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
