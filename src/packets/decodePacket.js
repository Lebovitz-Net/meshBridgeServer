// src/bridge/packets/packetDecoders.js
import protobuf from 'protobufjs';
import { unFrame, getProtobufs, getDecodeTypes } from '../utils/protoUtils.js';

// Protobuf type handles

function inspectUnknown(buffer) {
  const stripped = unFrame(buffer);
  const reader = protobuf.Reader.create(stripped);
  const fields = [];

  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    const fieldNum = tag >>> 3;
    const wireType = tag & 7;
    fields.push({ fieldNum, wireType, offset: reader.pos });
    reader.skipType(wireType);
  }

  return fields;
}

export function tryDecodeBuf(buffer, type) {
  try {
    return getProtobufs(type).decode(unFrame(buffer));
  } catch {
    return null;
  }
}

function tryDecodeAll(buffer, meta = {}) {
  const stripped = unFrame(buffer);

  for (const [key, value] of getDecodeTypes()) {
    try {
      const decoded = value.decode(stripped);
      if (decoded == null) // this should be caught
        break;
      else if (Object.keys(decoded).length > 0) {
        return { type: key, ...decoded, ...meta };
      } else return { type: key, ...meta};
    } catch {
      // Silent fail—no terminal spam
      continue;
    }
  }
  // If no type matched, return raw buffer for inspection
  return { type: 'Unknown' };
}

export function toNodeIdString(num) {
  return '!' + Number(num >>> 0).toString(16).padStart(8, '0');
}

export function decodePacket(buffer, source = 'tcp', connId = 'unknown') {

  const packet = tryDecodeAll(buffer, { source, connId });

  return packet;
}

/**
 * Encode a ToRadio protobuf message with framing header.
 * @param {object} obj - Fields for meshtastic.ToRadio
 * @returns {Buffer}
 */
export function encodeToRadio(obj) {
  const toRadio = getProtobufs('ToRadio');
  if (!toRadio) throw new Error('Protobuf types not initialized — call initProtoTypes() first');
  const err = toRadio.verify(obj);
  if (err) throw new Error(err);
  const packet = toRadio.create(obj);
  const buffer = toRadio.encode(packet).finish();
  return Buffer.concat([Buffer.from([0x94, 0xc3]), buffer]);
}

export function encodeTextMessage(data) {
  const { fromNodeNum, toNodeNum, messageId, channelNum, message, wantAck = true } = data;
  const Data = getProtobufs('Data');
  const dataPayload = Data.create({
      portnum: 1,
      payload: Buffer.from(message),
      bitfield: 1,
  });
  const MeshPacket = getProtobufs('MeshPacket');
  const meshPacketPayload = MeshPacket.create({
    from: fromNodeNum,
    to: toNodeNum,
    id: messageId,
    channel: channelNum,
    wantAck,
    decoded: dataPayload,
    priority: 1,
    hopLimit:  7
  });
  const encoded = encodeToRadio({ packet: meshPacketPayload });
  return encoded;
}
