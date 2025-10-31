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

export function decodeFromRadioFrame(frame) {
  const buffer = unFrame(frame);
  const data =  tryDecodeBuf(buffer, 'FromRadio');
  return data || null;
}
