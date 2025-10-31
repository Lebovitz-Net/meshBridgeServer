// src/handlers/meshRequests.js

import {
  buildToRadioFrame,
  buildTextMessage,
  buildRequestTelemetryFrame,
  buildRequestPositionFrame,
  buildRequestNodeInfoFrame
} from '../Meshtastic/packets/packetBuilder.js';

let meshRuntime = null;

export function bindMeshRuntime(runtime) {
  meshRuntime = runtime;
}

function send(packet) {
  if (!meshRuntime) throw new Error('Mesh runtime not bound');
  meshRuntime.send(send);
}

export const meshRequests = {
  wantConfigId: () => send(buildToRadioFrame('wantConfigId', 0)),

  sendMessage: (text, to = null) => send(buildTextMessage(text, to)),

  requestTelemetry: () => send(buildRequestTelemetryFrame()),

  requestPosition: () => send(buildRequestPositionFrame()),

  requestNodeInfo: () => send(buildRequestNodeInfoFrame())
};
