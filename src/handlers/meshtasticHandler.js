// src/handlers/meshHandler.js

import { EventEmitter } from 'events';
import createConnection from '../Meshtastic/tcpConnection.js';
import routePacket from '../Meshtastic/packets/packetRouter.js';

export default async function createMeshHandler(connId, host, port, opts = {}) {
  const {
    reconnect = { enabled: true },
    getConfigOnConnect = false
  } = opts;

  // Just create an EventEmitter directly
  const emitter = new EventEmitter();

  const connection =  createConnection({
    connId,
    host,
    port,
    reconnectPolicy: reconnect.enabled,
    emitter
  });

  return {
    send: (packet) => {
      if (Buffer.isBuffer(packet)) {
        connection.write(packet);
      } else {
        throw new Error("[meshtasticHandler] send packet must be a buffer");
      }
    },
    end: connection.stop,
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter)
  };
}
