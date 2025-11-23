import net from 'net';
import { EventEmitter } from 'events';
import { extractFrames } from './routing/frameParser.js';

export default class TcpSocket extends EventEmitter {
  constructor(connId, host, port) {
    super();
    this.connId = connId;
    this.host = host;
    this.port = port;
    this.socket = new net.Socket();
    this.buffer = Buffer.alloc(0);
    this.connected = false;

    this.connectedPromise = new Promise((resolve, reject) => {
      this.socket.connect(this.port, this.host, () => {
        this.connected = true;
        this.emit('connect', this._meta());
        resolve(this._meta());
      });

      this.socket.on('error', (err) => {
        this.connected = false;
        this.emit('error', this._meta(), err);
        reject(err);
      });
    });

    this._setupListeners();
  }

  _meta() {
    return {
      connId: this.connId,
      sourceIp: this.socket.remoteAddress,
      sourcePort: this.socket.remotePort,
      transport: 'tcp',
      host: this.host,
      port: this.port,
    };
  }

  _setupListeners() {
    this.socket.on('data', (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      const { frames, remainder } = extractFrames(this.buffer);
      this.buffer = remainder;

      frames.forEach((frame) => {
        this.emit('frame', { ...this._meta(), timestamp: Date.now() }, frame);
      });
    });

    this.socket.on('close', (hadError) => {
      this.connected = false;
      this.emit('close', this._meta(), hadError);
    });

    this.socket.on('timeout', () => {
      this.connected = false;
      this.emit('timeout', this._meta());
    });

    this.socket.on('drain', () => {
      this.emit('drain', this._meta());
    });

    this.socket.on('end', () => {
      this.connected = false;
      this.emit('end', this._meta());
    });
  }

  write(data) {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    if (!this.connected) {
      console.warn(`[TcpSocket ${this.connId}] Write attempted with no active connection`);
      return false;
    }
    console.log(`[TcpSocket ${this.connId}] SEND ${buf.length} bytes`, buf);
    const ok = this.socket.write(buf);
    if (!ok) console.warn(`[TcpSocket ${this.connId}] Write buffer full`);
    return ok;
  }

  end() {
    this.socket.end();
    console.log(`[TcpSocket ${this.connId}] Connection terminated`);
  }

  isConnected() {
    return this.connected;
  }
}
