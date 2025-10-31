// src/Meshtastic/handlers/meshtasticIngestionHandler.js

import { decodeFromRadioFrame } from './packets/packetDecode.js';

/**
 * Ingest a raw packet from the Meshtastic runtime.
 * @param {object} meta - metadata about the packet (runtimeId, sourceIp, etc.)
 * @param {Buffer} buffer - raw protobuf frame
 */
export function ingest(meta, buffer) {
  try {
    const frame = decodeFromRadioFrame(buffer);

    if (!frame) {
      console.warn('[meshtasticIngest] Failed to decode frame');
      return;
    }

    // TODO: add more packet type handling as needed
    // e.g. telemetry, text messages, logRecord, etc.

  } catch (err) {
    console.error('[meshtasticIngest] Error ingesting packet:', err);
  }
}
