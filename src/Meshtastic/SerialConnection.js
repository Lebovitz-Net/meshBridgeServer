// SerialConnection.js
import Connection from './Connection.js';
import SerialPort from 'serialport';
import { scheduleReconnect } from './scheduleReconnect.js';
import { v4 as uuidv4 } from 'uuid';

export default class SerialConnection extends Connection {
  constructor({ devicePath, baudRate, connId }) {
    super({ transport: 'serial', connId: connId || uuidv4() });
    this.devicePath = devicePath;
    this.baudRate = baudRate;
    this.serialConnections = new Map();
    this.reconnectPolicy = true;
    this.isShuttingDown = false;
  }

  /** Create and register a SerialPort */
  connect(connId = this.connId) {
    const port = new SerialPort({ path: this.devicePath, baudRate: this.baudRate });

    this.serialConnections.set(connId, {
      port,
      devicePath: this.devicePath,
      baudRate: this.baudRate,
      reconnectTimer: null,
    });

    // Forward events
    port.on('open', () => this.onConnect({ connId, devicePath: this.devicePath }));
    port.on('data', (buffer) => this.onFrame({ connId, devicePath: this.devicePath }, buffer));
    port.on('error', (err) => this.onError({ connId, devicePath: this.devicePath }, err));
    port.on('close', () => this.onClose({ connId, devicePath: this.devicePath }));

    return port;
  }

  onConnect(meta) {
    console.log(`[SerialConnection ${meta.connId}] Connected`);
    this.emit('connect', meta);
  }

  onFrame(meta, buffer) {
    // Delegate to base class
    this.onPacketReceived(meta, buffer);
  }

  onError(meta, err) {
    console.error(`[SerialConnection ${meta.connId}] Error: ${err.message}`, err);
    this.emit('error', meta, err);
    this._maybeReconnect(meta);
  }

  onClose(meta) {
    console.warn(`[SerialConnection ${meta.connId}] Closed`);
    this.emit('close', meta);
    this._maybeReconnect(meta);
  }

  _maybeReconnect(meta) {
    if (this.reconnectPolicy && !this.isShuttingDown) {
      scheduleReconnect(
        meta.connId,
        this.devicePath,
        this.baudRate,
        this.serialConnections,
        () => this.connect(meta.connId)
      );
    }
  }

  async start() {
    const port = this.connect(this.connId);
    // SerialPort doesn’t have a native promise, so we simulate open event
    await new Promise((resolve, reject) => {
      port.once('open', resolve);
      port.once('error', reject);
    });
    console.log(`[SerialConnection ${this.connId}] Startup complete`);
    return port;
  }

  stop() {
    this.isShuttingDown = true;
    this.serialConnections.forEach(({ port, reconnectTimer }) => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      port.close();
    });
    this.serialConnections.clear();
  }

  write(buf, connId = this.connId) {
    const entry = this.serialConnections.get(connId);
    const port = entry?.port;
    if (!port || !port.write) return false;
    const ok = port.write(buf);
    if (!ok) console.warn(`[SerialConnection ${connId}] Write failed`);
    return ok;
  }
}
