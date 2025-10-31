// src/MeshCore/handlers/meshcoreIngestionHandler.js
import { dispatchPacket } from './routing/dispatchPacket.js';
import { updateNodeState } from './sessionManager.js';

/**
 * Ingest a raw frame from MeshCore.
 * @param {object} meta - metadata about the packet (connId, source, etc.)
 * @param {Buffer|Uint8Array} frame - raw frame
 */
// we can actually handle this with an emitter. We don't need
// to hard connect this.
export function ingest(type, data) {
  const { meta } = data;
  console.log('ingest type', type);
  try {
    // Route + update session state
    dispatchPacket({type, data });
    updateNodeState(meta.connId, {
      lastSeen: Date.now(),
      metadata: { source: 'meshcore' }
    });

  } catch (err) {
    console.error('[meshcoreIngest] Error Reesponding to packet:', err);
  }
}
