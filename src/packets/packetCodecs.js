// src/bridge/packets/packetDecoders.js
import protobuf from 'protobufjs';
import protoJson from '../assets/proto.json' with { type: 'json' };
import { normalizeBuffers } from './packetUtils.js';
import { send } from 'vite';

// Protobuf type handles
let root;
let ToRadio;
let mqtt;
const meshMap = new Map;

export async function initProtoTypes () {
  root = protobuf.Root.fromJSON(protoJson);
  const meshTypes = [ 'FromRadio', 'MeshPacket', 'NodeInfo', 'MyNodeInfo', 'Config', 'ModuleConfig', 
                      'Position', 'Telemetry', 'AdminMessage', 'User', 'LogRecord', 'ToRadio', 'Data',
                      'DeviceMetrics', ];

  meshTypes.map((type) => {
    meshMap.set(type, root.lookupType(`meshtastic.${type}`));
  });
}

export const getProtobufs = (key) => meshMap.get(key);
export const getProtobufTypes = (type) => getProtobufs(type).oneofs.payloadVariant.oneof;

export function inspectUnknown(buffer) {
  const stripped = stripFramingHeader(buffer);
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

export function tryDecodeBytes(buffer, meta = {}) {
  const stripped = stripFramingHeader(buffer);

  for (const [key, value] of meshMap) {
    try {
      const decoded = value.decode(stripped);
      // Optional: validate presence of expected fields
      if (decoded && Object.keys(decoded).length > 0) {
        return { type: key, ...decoded, ...meta };
      }
    } catch {
      // Silent fail—no terminal spam
      continue;
    }
  }
  // If no type matched, return raw buffer for inspection
  return { type: 'Unknown' };
}


export function stripFramingHeader(buf) {
  return buf?.[0] === 0x94 && buf?.[1] === 0xc3 ? buf.subarray(2) : buf;
}

export function toNodeIdString(num) {
  return '!' + Number(num >>> 0).toString(16).padStart(8, '0');
}

export function decodeAndNormalize(buffer, source = 'tcp', connId = 'unknown') {

  const raw = tryDecodeBytes(buffer, { source, connId });

  const normalized = normalizeBuffers(raw);
  // const categorized = packetHandlers[raw.type]?.(normalized) || normalized;

  return normalized;
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
  const message = toRadio.create(obj);
  const buffer = toRadio.encode(message).finish();
  return Buffer.concat([Buffer.from([0x94, 0xc3]), buffer]);
}

export function encodeTextMessage(data) {
  const { fromNodeNum, toNodeNum, messageId, channelNum, payload, wantAck = true } = data;
  const Data = getProtobufs('Data');
  const dataPayload = Data.create({
      portnum: 1,
      payload: Buffer.from(payload),
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
  });
  const encoded = encodeToRadio({ packet: meshPacketPayload });
  return encoded;
}
