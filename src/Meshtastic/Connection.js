import { EventEmitter } from 'events';

export default class Connection extends EventEmitter {
  constructor({ transport, connId }) {
    super();
    this.transport = transport;
    this.connId = connId;
    this.metaOverrides = {};
  }

  /** Called by subclasses when a packet is received */
  onReceivedPacket(meta, buffer) {
    const enrichedMeta = {
      ...meta,
      ...this.metaOverrides,
      transport: this.transport,
      connId: this.connId,
      timestamp: Date.now(),
    };

    // Emit unified packet event
    this.emit('packet', enrichedMeta, buffer);
  }

  /** Subclasses must implement actual send logic */
  sendPacket(buffer) {
    throw new Error('sendPacket() must be implemented by subclass');
  }
}
