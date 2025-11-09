// src/MeshCore/meshcoreTCPHandler.js
import { EventEmitter } from 'events';
import { ingest } from './meshcoreIngestionHandler.js';
import Constants from '../../external/meshcore.js/src/constants.js';
import TCPConnection from './meshcore_connection.js';

/**
 * MeshCore TCP Handler
 * Wraps the external TCPConnection into a framework-friendly interface.
 *
 * @param {string} connId - Unique connection identifier
 * @param {string} host - MeshCore host
 * @param {number} port - MeshCore port
 * @param {object} opts - Optional connection options
 */

export async function createMeshcoreTCPHandler(connId, host, port, opts = {}) {
  const emitter = new EventEmitter();
  const tcp = new TCPConnection(host, port);

  const baseEmitter = tcp.emit.bind(tcp);
  // pick up all events from the connection layer and process the ones we care about
  // We should process connect, disconnect, response codes and push codes. Make sure
  // to pass on the baseEmitters in case the meshcore.js uses events internally.
  tcp.emit = (eventName, data) => {
    // if (Object.values(Constants.ResponseCodes).includes(eventName)) {
    if (Number(eventName) || Number(eventName) ===  0) {
      switch (eventName) {
        case 10: // noMoreMessages
        case 5:  // selfInfo
        case 0: 
          emitter.emit('ok', {connId, data});
          break;
        case 1: 
          emitter.emit('err', {connId, data});
          break;
        default:
          break;
      }
      ingest(eventName, {
        data,
        meta: {
          connId,
          source: 'meshcore',
          timestamp: Date.now(),
        }
      });
    } else {

      switch (eventName) {
        case 'rx':
          console.log("got an rx");
          break
        case 'tx':
          emitter.emit('tx', { connId, data });
          break;
        case 'connected':
          console.log('.../meshcoretcpHandler got connected');
          emitter.emit('connected', { connId, host, port });
          break;
        case 'disconnected':
          emitter.emit('disconnected', { connId, host, port });
          break;
      }
    }

    baseEmitter(eventName, data);
  };

  // Connect immediately
  await tcp.connect();

  return {
    id: connId,
    type: 'meshcore',
    on: emitter.on.bind(emitter),
    close: () => tcp.close(),
    writeFrame: (frameType, frameData) => tcp.writeFrame(frameType, frameData),
    sendToRadioFrame: (data) => tcp.sendToRadioFrame(data),
    tcp,
  };
}
