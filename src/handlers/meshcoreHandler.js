// meshcoreHandler.js

import { EventEmitter } from 'events';
import { createMeshcoreTCPHandler } from '../MeshCore/meshcoreTCPHandler.js';
import Packet from '../../external/meshcore.js/src/packet.js';
import { dispatch } from '../MeshCore/packetRouter.js';
import { updateNodeState } from '../MeshCore/sessionManager.js';

export default async function createMeshcoreHandler(connId, host, port, opts = {}) {
  const emitter = new EventEmitter();

  // Create TCP handler (returns { on, tcp, ... })
  const tcpRuntime = await createMeshcoreTCPHandler(connId, host, port, opts);
  const { tcp } = tcpRuntime; // actual TCPConnection instance

  // Decode inbound frames and emit normalized packets
  tcpRuntime.on('frame', (data) => {
    const { frame } = data;
      emitter.emit('packet', {
        meta: {
          connId,
          source: 'meshcore',
          timestamp: Date.now(),
        },
        packet: frame,
      });
  });

  // Pass through lifecycle events
  tcpRuntime.on('connected', (info) => emitter.emit('connected', info));
  tcpRuntime.on('disconnected', (info) => emitter.emit('disconnected', info));
  tcpRuntime.on('tx', (info) => emitter.emit('tx', info));
  tcpRuntime.on('ok', (info) => emitter.emit('ok', info));
  tcpRuntime.on('err', (err) => emitter.emit('err', err));

  // Await the "connected" event
  async function awaitConnected(timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        emitter.off('connected', onConnected);
        reject(new Error(`connected timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      function onConnected(info) {
        clearTimeout(timer);
        emitter.off('connected', onConnected);
        resolve(info);
      }

      emitter.on('connected', onConnected);
      emitter.once('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  return {
    id: connId,
    type: 'meshcore',
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
    once: emitter.once.bind(emitter),
    awaitConnected,
    tcp, // expose the full TCPConnection instance
  };
}
