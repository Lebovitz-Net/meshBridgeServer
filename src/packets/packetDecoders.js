// src/bridge/packets/packetDecoders.js
import protobuf from 'protobufjs';
import protoJson from '../assets/proto.json' with { type: 'json' };
import { normalizeBuffers } from './packetUtils.js';
import { logPacket } from './packetLogger.js';

// Protobuf type handles
let root;
let MeshPacket, FromRadio, NodeInfo, Telemetry, DeviceMetrics, ToRadio;

/**
 * Initialize all protobuf types for decoding AND encoding.
 * Call this once at server startup before using decodeAndNormalize or encodeToRadio.
 */
export async function initProtoTypes() {
  root = protobuf.Root.fromJSON(protoJson);

  // Decoding types
  MeshPacket     = root.lookupType('meshtastic.MeshPacket');
  FromRadio      = root.lookupType('meshtastic.FromRadio');
  NodeInfo       = root.lookupType('meshtastic.NodeInfo');
  Telemetry      = root.lookupType('meshtastic.Telemetry');
  DeviceMetrics  = root.lookupType('meshtastic.DeviceMetrics');

  // Encoding type
  ToRadio        = root.lookupType('meshtastic.ToRadio');

  console.log('[Proto Init] Protobuf types initialized (decode + encode)');
}

export function stripFramingHeader(buf) {
  return buf?.[0] === 0x94 && buf?.[1] === 0xc3 ? buf.subarray(2) : buf;
}

export function toNodeIdString(num) {
  return '!' + Number(num >>> 0).toString(16).padStart(8, '0');
}

function tryDecodeBytes(buffer, type) {
  try {
    return type.decode(stripFramingHeader(buffer));
  } catch {
    return null;
  }
}

function classifyMeshPacket(mp, source) {
  const fromNum = mp.from ?? null;
  const nodeId = fromNum != null ? toNodeIdString(fromNum) : 'UnknownNode';
  let type = 'MeshPacket';
  let inner = {};

  if (mp.decoded?.portnum !== undefined && mp.decoded?.payload) {
    const res = decodeByPort(mp.decoded.portnum, mp.decoded.payload);
    if (res?.type) type = res.type;
    if (res?.decoded) inner = res.decoded;
  }

  return {
    type,
    from: fromNum,
    fromNum,
    nodeId,
    viaMqtt: !!mp.viaMqtt,
    decoded: inner,
    payload: inner,
    source
  };
}

function decodeByPort(portnum, payload) {
  switch (portnum) {
    case 67: return { type: 'NodeInfo', decoded: tryDecodeBytes(payload, NodeInfo) };
    case 68: return { type: 'Telemetry', decoded: tryDecodeBytes(payload, Telemetry) };
    case 69: return { type: 'DeviceMetrics', decoded: tryDecodeBytes(payload, DeviceMetrics) };
    default: return null;
  }
}

const packetHandlers = {
  FromRadio: (packet) => packet?.nodeInfo?.user?.id ? packet : null,
  MeshPacket: (packet) => classifyMeshPacket(packet, packet.source || 'tcp')
};

export function decodeAndNormalize(buffer, source = 'tcp', connId = 'unknown') {
  const raw =
    tryDecodeBytes(buffer, FromRadio) ||
    tryDecodeBytes(buffer, MeshPacket);

  if (!raw) return { type: 'Unknown', source };

  raw.type = raw.constructor?.name || 'Unknown';
  raw.source = source;
  raw.connId = connId;

  // if (raw.packet && raw.packet.decoded && raw.packet.decoded.portnum === 1) {
  //   console.log('[decodeAndNormalize] Decoded raw packet:', raw.packet);
  // };

  logPacket({
    type: raw.type,
    variant: raw.payloadVariant,
    nodeId: raw.nodeId || 'UnknownNode',
    timestamp: Date.now(),
    source,
    payload: raw
  });

  const normalized = normalizeBuffers(raw);
  const categorized = packetHandlers[raw.type]?.(normalized) || normalized;

  return categorized;
}

/**
 * Encode a ToRadio protobuf message with framing header.
 * @param {object} obj - Fields for meshtastic.ToRadio
 * @returns {Buffer}
 */
export function encodeToRadio(obj) {
  if (!ToRadio) throw new Error('Protobuf types not initialized — call initProtoTypes() first');
  const err = ToRadio.verify(obj);
  if (err) throw new Error(err);
  const message = ToRadio.create(obj);
  const buffer = ToRadio.encode(message).finish();
  return Buffer.concat([Buffer.from([0x94, 0xc3]), buffer]);
}
