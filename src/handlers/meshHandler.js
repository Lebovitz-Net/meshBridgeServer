// src/bridge/meshHandler.js
import { EventEmitter } from 'node:events';
import createTCPHandler from '../handlers/tcpHandler.js';
import { encodeToRadio } from '../packets/packetDecoders.js';
import {
  buildAdminGetConfigFrame,
  buildWantConfigIDFrame,
  buildWantTelemetryFrame
} from '../utils/protoHelpers.js';

export default function createMeshHandler(
  connId,
  host,
  port,
  routePacket,
  opts = {}
) {
  const emitter = new EventEmitter();

  const {
    getConfigOnConnect = true,
    wants = {
      want_config: true,
      want_telemetry: true,
      want_nodeinfo: true,
      want_position: false
    },
    reconnect = {
      enabled: true,
      minMs: 1000,
      maxMs: 30000,
      factor: 2,
      jitter: 0.2
    }
  } = opts;

  let tcp = null;
  let ended = false;

  // Exponential backoff state
  let attempt = 0;
  const minMs = reconnect.minMs ?? 1000;
  const maxMs = reconnect.maxMs ?? 30000;
  const factor = reconnect.factor ?? 2;
  const jitter = reconnect.jitter ?? 0.2;

  const computeDelay = () => {
    const base = Math.min(maxMs, minMs * Math.pow(factor, Math.max(0, attempt - 1)));
    const delta = base * jitter;
    const jittered = base + (Math.random() * 2 - 1) * delta;
    return Math.max(minMs, Math.floor(jittered));
  };

  function sendInit() {
    try {
      if (getConfigOnConnect) {
        tcp.write(buildAdminGetConfigFrame());
        tcp.write(buildWantConfigIDFrame());
        tcp.write(buildWantTelemetryFrame());
        emitter.emit('ready');
      }
    } catch (err) {
      emitter.emit('error', err);
      console.warn(`[Mesh ${connId}] Init send failed:`, err);
    }
  }

  function wireTCP() {
    tcp = createTCPHandler(connId, host, port, {
      onConnect: (meta) => {
        attempt = 0; // reset backoff
        console.log(`[Mesh ${connId}] Connected to ${host}:${port}`);
        emitter.emit('connect', meta);
        sendInit();
      },

      onFrame: (meta, frame) => {
        try {
          // Pass raw frame + full meta to routePacket
          routePacket(frame, {
            ...meta,
            source: 'mesh', // override/clarify source
          });
        } catch (err) {
          emitter.emit('error', err);
          console.warn(`❌ [Mesh ${meta.connId}] Frame routing error:`, err);
        }
      },

      onError: (meta, err) => {
        emitter.emit('error', err);
        console.error(`[Mesh ${meta.connId}] TCP error:`, err?.message || err);
      },

      onClose: (meta, hadError) => {
        console.log(`[Mesh ${meta.connId}] Connection closed${hadError ? ' due to error' : ''}`);
        emitter.emit('close', hadError);
        maybeReconnect();
      },

      onTimeout: (meta) => {
        const err = new Error('Connection timed out');
        emitter.emit('error', err);
        console.warn(`[Mesh ${meta.connId}] Connection timed out`);
      },

      onDrain: (meta) => {
        // optional: backpressure observability
      },

      onEnd: (meta) => {
        console.log(`[Mesh ${meta.connId}] TCP connection ended by remote`);
      }
    });
  }

  function maybeReconnect() {
    if (ended || !reconnect.enabled) return;

    attempt += 1;
    const delay = computeDelay();

    if (delay > maxMs && attempt > 1) {
      emitter.emit('reconnectGiveUp');
      console.warn(`[Mesh ${connId}] Reconnect backoff exceeded, giving up`);
      return;
    }

    emitter.emit('reconnectAttempt', attempt, delay);
    console.log(`[Mesh ${connId}] Reconnecting in ${delay}ms (attempt ${attempt})...`);
    setTimeout(() => {
      if (ended) return;
      wireTCP();
    }, delay);
  }

  // First connect
  wireTCP();

  return {
    write(buf) {
      if (tcp && tcp.write) tcp.write(buf);
    },
    end() {
      ended = true;
      if (tcp && tcp.end) tcp.end();
    },
    on: (...args) => emitter.on(...args),
    off: (...args) => emitter.off(...args)
  };
}
