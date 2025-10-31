import {getProtobufs, getProtobufTypes, START1, START2 } from '../utils/protoUtils.js';
import { encodeTextMessage } from './packetEncoder.js';

let currentId = 1;

export function generateNewId() {
  // Increment and wrap at 32-bit unsigned max
  currentId = (currentId + 1) >>> 0; // force unsigned 32-bit
  return currentId;
}


// ----------------------------------------------------------------------------------------
// Build and Encode
// ----------------------------------------------------------------------------------------

export function frame(bytes, opts = {}) {
  const { includeHeader = true } = opts;
  if (!includeHeader) return bytes;

  const len = bytes.length;
  const header = [START1, START2, (len >> 8) & 0xff, len & 0xff];

  // Use spread to merge header and bytes, then wrap in Uint8Array
  return Buffer.from([...header, ...bytes]);
}


export function unFrame(buf) {
  return buf?.[0] === START1 && buf?.[1] === START2 ? buf.subarray(2) : buf;
}


export function buildToRadioFrame(fieldName, value, opts = {}) {
  if (!getProtobufTypes('ToRadio').has(fieldName)) {
    console.warn(`Invalid fieldName: ${fieldName} not in ToRadio.oneof`);
    return null;
  }
  const ToRadio = getProtobufs('ToRadio');
  const toRadioMsg = ToRadio.create({ [fieldName]: value });
  const encoded = ToRadio.encode(toRadioMsg).finish();
  return frame(encoded, opts);
}

export function buildMeshPacketFrame(type, payload, opts = {}) {
  const decoded = Data.create({
    portnum: PortNum.values[type],
    payload,
    bitfield: 1
  });

  const MeshPacket = getProtobufs('MeshPacket');
  const mesh = MeshPacket.create({
    from: opts.from ?? 0x1,
    to: opts.to ?? getChannelMapping(0),
    channel: opts.channel ?? 0,
    id: opts.id ?? Math.floor(Math.random() * 0xffffffff),
    rxTime: Number(Date.now()),
    viaMqtt: 1,
    hoptstart: 1,
    decoded
  });
  const encoded = MeshPacket.encode(mesh).finish();
  return frame(encoded, opts);
}

// ACK builder: returns encoded ToRadio frame
export function buildAckMeshPacket(originalId, from, to) {
  const MeshPacket = getProtobufs('MeshPacket');

  // Build the MeshPacket with ACK payload
  const meshPacket = MeshPacket.create({
    id: generateNewId(),       // unique ID for this ACK
    from,                      // our node ID
    to,                        // destination node ID (the sender of the original packet)
    wantAck: false,            // never set on ACK
    ack: { id: originalId }    // oneof field, protobuf sets payloadVariant
  });

  // Wrap in ToRadio and encode
  return buildToRadioFrame(meshPacket);
}

// Deprecated. No longer supported
export function buildAdmminMessageFrame(request, opts = {}) {
  const AdminMessage = getProtobufs('AdminMessage');
  const admin = AdminMessage.create(request);
  const encoded = AdminMessage.encode(admin).finish();

  return buildMeshPacketFrame("ADMIN_APP", encoded, opts);
}

export function buildRequestTelemetryFrame(packet, opts) {
  // no such request
}

export function buildRequestPositionFrame(packet, opts) {
  // no such request
}

export function buildRequestNodeInfoFrame(packet, opts) {
  // no such request
}

export function buildTextMessage(packet, opts = {}) {
    const message = packet.message || '';
    const sendBuf = {
      messageId: packet.messageId || null,
      channelId: packet.channelNum,
      fromNodeNum: packet.fromNodeNum || null,
      toNodeNum: packet.toNodeNum ?? 4294967295, // Broadcast by default
      message,
      wantAck: true,
      wantReply: false,
      replyId: null,
      timestamp: Date.now()
    };
    return encodeTextMessage(sendBuf);
}