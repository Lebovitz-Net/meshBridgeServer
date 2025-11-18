import Packet from '../../external/meshcore.js/src/packet.js';
import BufferReader from '../../external/meshcore.js/src/buffer_reader.js';
import TcpConnection from '../../external/meshcore.js/src/connection/tcp_connection.js';
import { portNums, getName } from './portnums.js';
import Constants from '../../external/meshcore.js/src/constants.js';

export default class MeshcoreConnection extends TcpConnection {
  constructor(host, port) {
    super(host, port);
    this.readBuffer = [];
  }

    attemptReconnect() {
    if (this._reconnectInProgress) return;
    this._reconnectInProgress = true;

    console.warn(`[${new Date().toISOString()}] Attempting reconnect`);

    if (this.socket) {
      try {
        this.socket.destroy();
      } catch (err) {
        console.error("Error destroying socket during reconnect:", err);
      }
      this.socket = null;
    }

    if (typeof this.emit === 'function') {
      this.emit('connection_lost', { timestamp: Date.now() });
    }

    this._reconnectAttempts = (this._reconnectAttempts || 0) + 1;
    const delay = Math.min(3000 * this._reconnectAttempts, 15000); // max 15s

    setTimeout(() => {
      this._reconnectInProgress = false;
      this.connect();
    }, delay);
  }

    async connect() {
    const { Socket } = await import("net");
    this.socket = new Socket();

    this.socket.on('data', (data) => {
      this.onSocketDataReceived(data);
    });

    this.socket.on('error', (error) => {
      console.error('Connection Error', error);
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        this.attemptReconnect();
      }
    });

    this.socket.on('close', (hadError) => {
      console.warn(`Socket closed${hadError ? ' due to error' : ''}`);
      if (hadError) this.attemptReconnect();
    });

    // this.socket.setTimeout(30000);
    // this.socket.on('timeout', () => {
    //   console.warn("Socket read timeout — reconnecting");
    //   this.attemptReconnect();
    // });

    this.socket.connect(this.port, this.host, async () => {
      await this.onConnected();
      this._reconnectInProgress = false;
    });
  }

  getCurrentIPAddress() {
    return this.socket.remoteAddress;
  }

  onSocketDataReceived(data) {
    this.readBuffer = [...this.readBuffer, ...data];
    const frameHeaderLength = 3;

    while (this.readBuffer.length >= frameHeaderLength) {
      try {
        const reader = new BufferReader(this.readBuffer.slice(0, frameHeaderLength));
        const frameType = reader.readByte();
        const frameLength = reader.readUInt16LE();
        const requiredLength = frameHeaderLength + frameLength;

        if (frameType !== Constants.SerialFrameTypes.Incoming &&
            frameType !== Constants.SerialFrameTypes.Outgoing) {
          this.readBuffer = this.readBuffer.slice(1);
          continue;
        }

        if (!frameLength || this.readBuffer.length < requiredLength) break;

        const frameData = this.readBuffer.slice(frameHeaderLength, requiredLength);
        this.readBuffer = this.readBuffer.slice(requiredLength);

        this.routeFrame(frameData);
      } catch (e) {
        console.error("Failed to process frame", e);
        break;
      }
    }
  }

  routeFrame(frameData) {
    const frameType = frameData[0]; // assuming first byte is frame type
    const isStructured = (frameType === Constants.SerialFrameTypes.Incoming || 
                          frameType === Constants.SerialFrameTypes.Outgoing);

    if (!isStructured) {
      this.onFrameReceived(frameData);
      return;
    }
    const MIN_PACKET_LENGTH = 4;
    if (frameData.length < MIN_PACKET_LENGTH) {
       console.warn(`Dropping short frame: ${frameData.length} bytes`, frameData);
      return;
    }

    const packet = Packet.fromBytes(frameData);

    if (packet.payload_type !== Packet.PAYLOAD_TYPE_RAW_CUSTOM) {
      this.onFrameReceived(frameData);
      return;
    }

    const portNum = this.extractPortNum(packet.payload);
    const portName = getName(portNum);
    const eventName = `portnum_${portName}`;
    const decoded = this.decodePortPayload(portNum, packet.payload);
    this.emit(eventName, decoded);
  }

  extractPortNum(payload) {
    const reader = new BufferReader(payload);
    return reader.readByte(); // assumes portNum is first byte
  }

  decodePortPayload(portNum, payload) {
    const reader = new BufferReader(payload.slice(1)); // skip portNum
    switch (portNum) {
      case portNums.Contact:
        return this.decodeContact(reader);
      case portNums.ContactSync:
        return this.decodeContactSync(reader);
      case portNums.Telemetry:
        return this.decodeTelemetry(reader);
      default:
        return { raw: payload };
    }
  }

  decodeContact(reader) {
    const contactId = reader.readBytes(16).toString('hex');
    const aliasLen = reader.readByte();
    const alias = reader.readBytes(aliasLen).toString('utf8');
    const lastSeen = reader.readUInt32LE();
    const rssi = reader.readInt8();
    return { contactId, alias, lastSeen, rssi };
  }

  decodeContactSync(reader) {
    return { syncData: reader.readRemainingBytes() };
  }

  decodeTelemetry(reader) {
    return { telemetry: reader.readRemainingBytes() };
  }

  // emit(eventName, data) {
  //   // console.log(`Emitting ${eventName}`, data);
  //   // Replace with your actual event system
  // }
}
