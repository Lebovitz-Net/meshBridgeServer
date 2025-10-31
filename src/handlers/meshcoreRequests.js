// src/handlers/meshcoreRequests.js

import {
  buildTextMessage,
  requestNodeInfo,
  requestTelemetry,
  requestPosition,
  wantConfigId
} from '../MeshCore/packetBuilder.js';

import { encode } from '../MeshCore/packetEncoder.js';

let meshcoreRuntime = null;

/**
 * Bind the active MeshCore transport runtime
 * @param {object} runtime - MeshCore handler with .send(packet)
 */
export function bindMeshRuntime(runtime) {
  meshcoreRuntime = runtime;
}

/**
 * Encode and send a packet via the bound runtime
 * @param {object} packet - Raw packet object
 */
function send(packet) {
  if (!meshcoreRuntime) throw new Error('MeshCore runtime not bound');
  const frame = encode(packet);
  meshcoreRuntime.send(frame);
}

/**
 * Request registry for MeshCore
 */
export const meshcoreRequests = {
  sendMessage: (payload) => send(buildTextMessage(payload)),

  requestNodeInfo: () => send(requestNodeInfo()),

  requestTelemetry: () => send(requestTelemetry()),

  requestPosition: () => send(requestPosition()),

  wantConfigId: () => send(wantConfigId())
};
