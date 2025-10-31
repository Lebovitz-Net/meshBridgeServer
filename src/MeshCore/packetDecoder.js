// MeshCore/packetDecoder.js
// THIS FILE IS DEPRECATED.
// we now receive decoded packets.

import Packet from '../../external/meshcore.js/src/packet.js'; // Canonical class from MeshCore.dev
import Connection from '../../external/meshcore.js/src/connection/connection.js';
import Constants from '../../external/meshcore.js/src/constants.js';
import { ingestHandler } from './meshcoreIngestionHandler.js';

const connection = new Connection();

const originalEmit = connection.emit.bind(connection);

// this picks up all emits from the meshcore.js connection emitter
// processes them for Responsecodes and then
// passes the event on to the original listeners
connection.emit = (eventName, data) => {
  if (Object.values(Constants.ResponseCodes).includes(eventName)) {
    ingestHandler(eventName, data);
    // logOverlay({
    //   responseCode: eventName,
    //   decoded: data,
    //   timestamp: Date.now(),
    // });
  }

  // Optional: capture other emissions for debugging
  if (eventName === 'rx' || eventName === 'connected' || eventName === 'disconnected') {
    // logOverlay({
    //   event: eventName,
    //   data,
    //   timestamp: Date.now(),
    // });
  }

  return originalEmit(eventName, data);
};

export function decodeFrame(data) {
  const { packet, meta } = data;
  connection.onFrameReceived(packet, meta);
}
