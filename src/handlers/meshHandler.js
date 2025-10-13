// src/bridge/meshHandler.js
import { EventEmitter } from 'node:events';
import { encodeToRadio } from '../packets/packetCodecs.js';
import { createToRadioFrame } from '../utils/protoUtils.js';
import createIngestionHandler from '../handlers/ingestionHandler.js';
import { routePacket } from '../core/routePacket.js';
import { waitForMapping } from '../core/nodeMapping.js';

export default async function createMeshHandler(connId, host, port, opts = {}) {
  const emitter = new EventEmitter();

  const {
    getConfigOnConnect = true,
    reconnect = { enabled: true }
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
        ingestionHandler.write(createToRadioFrame('wantConfigId', 0));
        await waitForMapping(host, { timeout: 5000 });

        // ingestionHandler.write(buildAdminGetConfigFrame());
        // await delay(500);

        // ingestionHandler.write(buildGetOwnerFrame());
        // await delay(500);

        // ingestionHandler.write(buildWantTelemetryFrame());

        emitter.emit('ready');
      }
    } catch (err) {
      emitter.emit('error', err);
      console.warn(`[Mesh ${connId}] Init send failed:`, err);
    }
  }

  // ⏳ Wait for TCP connection before proceeding
  await ingestionHandler.start();
  await sendInit();

  return {
    write: (packet) => {
      if (!Buffer.isBuffer(packet)) {
        const frame = encodeToRadio(packet);
        ingestionHandler.write(frame);
      } else {
        ingestionHandler.write(packet);
      }
    },
    end: () =>  {
      ingestionHandler.stop();
    },
    on: (...args) => emitter.on(...args),
    off: (...args) => emitter.off(...args)
  };
}
