// meshcoreHandler.js

import { EventEmitter } from 'events';
import { ingest } from '../MeshCore/meshcoreIngestionHandler.js';
import TCPConnection from '../MeshCore/meshcore_connection.js';
import { MeshcoreRequests } from './meshcoreRequests.js';

export default async function createMeshcoreHandler(netParams,  opts = {}) {
  const emitter = new EventEmitter();
  const { host, port, connId } = netParams;
  const tcp = new TCPConnection(host, port);
  const tcpHandler = {
    on: emitter.on.bind(emitter),
    connection: tcp,
  }
  const request = new MeshcoreRequests(tcpHandler, 10000);

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
        case 4:  // EndOfContacts
        case 0:  // Ok
          console.log(`.../createMeshcoreTCPHandler got Ok event ${eventName}`);
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
          currentIP: tcp.getCurrentIPAddress(),
          connId,
          source: 'meshcore',
          timestamp: Date.now(),
        }
      });
    } else {

      switch (eventName) {
        case 'rx':
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
    type: tcpHandler.type,
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
    once: emitter.once.bind(emitter),
    awaitConnected,
    request,
  };
}
