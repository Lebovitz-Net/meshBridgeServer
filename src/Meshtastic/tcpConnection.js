// TcpConnection.js
import Connection from './Connection.js';
import TcpSocket from './TcpSocket.js';
import { scheduleReconnect } from './scheduleReconnect.js';
import { v4 as uuidv4 } from 'uuid';

export default class TcpConnection extends Connection {
  constructor({ host, port, connId }) {
    super({ transport: 'tcp', connId: connId || uuidv4() });
    this.host = host;
    this.port = port;
    this.tcpConnections = new Map();
    this.reconnectPolicy = true;
    this.isShuttingDown = false;
  }

  /** Create and register a TcpSocket */
  connect(connId = this.connId) {
    const tcp = new TcpSocket(connId, this.host, this.port);

    this.tcpConnections.set(connId, {
      tcp,
      host: this.host,
      port: this.port,
      reconnectTimer: null,
    });

    // Forward events from TcpSocket into Connection surface
    tcp.on('connect', (meta) => this.onConnect(meta));
    tcp.on('frame', (meta, buffer) => this.onFrame(meta, buffer));
    tcp.on('error', (meta, err) => this.onError(meta, err));
    tcp.on('close', (meta) => this.onClose(meta));
    tcp.on('timeout', (meta) => this.onTimeout(meta));
    tcp.on('end', (meta) => this.onEnd(meta));

    return tcp;
  }

  onConnect(meta) {
    console.log(`[TcpConnection ${meta.connId}] Connected`);
    this.emit('connect', meta);
  }

  onFrame(meta, buffer) {
    // Delegate to base class method
    this.onPacketReceived(meta, buffer);
  }

  onError(meta, err) {
    console.error(`[TcpConnection ${meta.connId}] Error: ${err.message}`, err);
    this.emit('error', meta, err);
    this._maybeReconnect(meta);
  }

  onClose(meta) {
    console.warn(`[TcpConnection ${meta.connId}] Closed`);
    this.emit('close', meta);
    this._maybeReconnect(meta);
  }

  onTimeout(meta) {
    console.warn(`[TcpConnection ${meta.connId}] Timeout`);
    this.emit('timeout', meta);
    this._maybeReconnect(meta);
  }

  onEnd(meta) {
    console.warn(`[TcpConnection ${meta.connId}] Remote end`);
    this.emit('end', meta);
    this._maybeReconnect(meta);
  }

  _maybeReconnect(meta) {
    if (this.reconnectPolicy && !this.isShuttingDown) {
      scheduleReconnect(
        meta.connId,
        this.host,
        this.port,
        this.tcpConnections,
        () => this.connect(meta.connId)
      );
    }
  }

  async start() {
    const tcp = this.connect(this.connId);
    await tcp.connectedPromise;
    console.log(`[TcpConnection ${this.connId}] Startup complete`);
    return tcp;
  }

  stop() {
    this.isShuttingDown = true;
    this.tcpConnections.forEach(({ tcp, reconnectTimer }) => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      tcp.end();
    });
    this.tcpConnections.clear();
  }

  write(buf, connId = this.connId) {
    const entry = this.tcpConnections.get(connId);
    const tcp = entry?.tcp;
    if (!tcp || !tcp.write) return false;
    const ok = tcp.write(buf);
    if (!ok) console.warn(`[TcpConnection ${connId}] Write failed`);
    return ok;
  }
}
