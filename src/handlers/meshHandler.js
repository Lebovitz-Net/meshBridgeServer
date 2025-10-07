// src/bridge/meshHandler.js
import { EventEmitter } from 'node:events';
import { encodeToRadio } from '../packets/packetDecoders.js';
import {
  buildAdminGetConfigFrame,
  buildWantConfigIDFrame,
  buildWantTelemetryFrame
} from '../utils/protoHelpers.js';
import createIngestionHandler from '../handlers/ingestionHandler.js';
import { routePacket } from '../core/ingestionRouter.js';

 

export default function createMeshHandler(connId, host, port, opts = {}) {
  const emitter = new EventEmitter();

  const {
    getConfigOnConnect = true,
    reconnect = {
      enabled: true
    }
  } = opts;

  const ingestionHandler = createIngestionHandler({
    host,
    port,
    connId,
    reconnectPolicy: reconnect.enabled,
    onFrame: (meta, buffer) => {
      routePacket(buffer, {
        ...meta,
        source: 'mesh'
      });
    }
  });

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function sendInit() {
  try {
    if (getConfigOnConnect) {
      ingestionHandler.write(buildAdminGetConfigFrame());
      await delay(500);

      ingestionHandler.write(buildWantConfigIDFrame());
      await delay(500);

      ingestionHandler.write(buildWantTelemetryFrame());

      emitter.emit('ready');
    }
  } catch (err) {
    emitter.emit('error', err);
    console.warn(`[Mesh ${connId}] Init send failed:`, err);
  }
}

  ingestionHandler.start();
  sendInit();

  return {
    write(packet) {
      if (!Buffer.isBuffer(packet)) {
        const frame = encodeToRadio(packet);
        ingestionHandler.write(frame);
      } else {
        ingestionHandler.write(packet);
      }
    },
    end() {
      ingestionHandler.stop();
    },
    on: (...args) => emitter.on(...args),
    off: (...args) => emitter.off(...args)
  };
}
