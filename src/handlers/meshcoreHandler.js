import { EventEmitter } from 'events';
import { ingest } from '../MeshCore/meshcoreIngestionHandler.js';
import MeshcoreConnection from '../MeshCore/meshcore_connection.js';
import { MeshcoreRequests } from './meshcoreRequests.js';
import { dispatchPacket } from '../MeshCore/routing/dispatchPacket.js';
import { updateNodeState } from '../MeshCore/sessionManager.js';

export default class MeshcoreHandler extends EventEmitter {
  constructor(netParams, opts = {}) {
    super();
    const { host, port, connId } = netParams;

    this.host = host;
    this.port = port;
    this.connId = connId;

    this.tcp = new MeshcoreConnection (host, port);
    this.request = new MeshcoreRequests({ 
      on: this.on.bind(this), 
      connection: this.tcp 
    }, 10000);

    // Preserve original emitter
    this.baseEmit = this.tcp.emit.bind(this.tcp);

    // Override TCP emit to delegate to class method
    this.tcp.emit = this.handleTcpEmit.bind(this);
  }

  handleTcpEmit(eventName, data) {
    if (Number(eventName) || Number(eventName) === 0) {
      switch (eventName) {
        case 10: // noMoreMessages
        case 5:  // selfInfo
        case 4:  // EndOfContacts
        case 0:  // Ok
          this.emit('ok', { connId: this.connId, data });
          break;
        case 1:
          this.emit('err', { connId: this.connId, data });
          break;
      }
      ingest(eventName, {
        data,
        meta: {
          currentIP: this.tcp.getCurrentIPAddress(),
          connId: this.connId,
          source: 'meshcore',
          timestamp: Date.now(),
        }
      });
    } else {
      switch (eventName) {
        case 'rx':
          break;
        case 'tx':
          this.emit('tx', { connId: this.connId, data });
          break;
        case 'connected':
          console.log('.../meshcoretcpHandler got connected');
          this.emit('connected', { connId: this.connId, host: this.host, port: this.port });
          break;
        case 'disconnected':
          this.emit('disconnected', { connId: this.connId, host: this.host, port: this.port });
          break;
      }
    }

    // Always forward to original emitter
    this.baseEmit(eventName, data);
  }



  /**
   * Ingest a raw frame from MeshCore.
   * @param {object} meta - metadata about the packet (connId, source, etc.)
   * @param {Buffer|Uint8Array} frame - raw frame
   */
  ingest(type, data) {
    const { meta } = data;
    try {
      // Route + update session state
      dispatchPacket({type, data });
      updateNodeState(meta.connId, {
        lastSeen: Date.now(),
        metadata: { source: 'meshcore' }
      });

    } catch (err) {
      console.error('[meshcoreIngest] Error Reesponding to packet:', err);
    }
  }


  async connect(timeoutMs = 5000) {
    await this.tcp.connect();

    // Wait until the 'connected' event fires
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off('connected', onConnected);
        reject(new Error(`connected timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      const onConnected = (info) => {
        clearTimeout(timer);
        this.off('connected', onConnected);
        resolve(info);
      };

      this.on('connected', onConnected);
      this.once('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
}
