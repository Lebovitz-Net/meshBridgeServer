import protobuf from 'protobufjs';
import protoDef from '../assets/proto.json' with { type: 'json' };
import { decodeFrame } from '../packets/decodeFrame.js';
import { getChannelMapping } from '../core/nodeMapping.js';
import { getProtobufs, getProtobufTypes } from '../packets/packetCodecs.js';

import crypto from 'crypto';

const START1 = 0x94;
const START2 = 0xc3;

const root = protobuf.Root.fromJSON(protoDef);

import os from 'os';

function getMacAddresses() {
  const interfaces = os.networkInterfaces();
  const macs = [];

  for (const iface of Object.values(interfaces)) {
    for (const config of iface) {
      if (!config.internal && config.mac !== '00:00:00:00:00:00') {
        macs.push(config.mac);
      }
    }
  }

  return macs;
}

/*
 * Generate a Meshtastic-style nodeNum from a seed or MAC address.
 * @param {Buffer|string} [seedInput] - Optional seed input. If omitted, uses first MAC from getMacAddresses().
 * @returns {number} - 32-bit unsigned node number.
 */
export function generateNodeNum(seedInput) {
  let seed;

  if (seedInput) {
    seed = Buffer.isBuffer(seedInput) ? seedInput : Buffer.from(seedInput, 'utf8');
  } else {
    const macList = getMacAddresses(); // Assume this returns array of MAC strings like ['A4:CF:12:34:56:78']
    const validMac = macList.find(mac => mac && mac !== '00:00:00:00:00:00');

    if (!validMac) {
      throw new Error('No valid MAC address found for fallback seed.');
    }

    seed = Buffer.from(validMac.replace(/:/g, ''), 'hex');
  }

  const hash = crypto.createHash('sha256').update(seed).digest();
  return hash.readUInt32BE(hash.length - 4);
}

// ----------------------------------------------------------------------------------------
// Build and Encode
// ----------------------------------------------------------------------------------------

export function frame(bytes, opts = {}) {
  const { includeHeader = true } = opts;
  if (!includeHeader) return bytes;

  const len = bytes.length;
  const header = new Uint8Array([START1, START2, (len >> 8) & 0xff, len & 0xff]);
  const framed = new Uint8Array(header.length + len);
  framed.set(header, 0);
  framed.set(bytes, header.length);
  return framed;
}

export function createToRadioFrame(fieldName, value, opts = {}) {
  if (!getProtobufTypes('ToRadio').includes(fieldName)) {
    console.warn(`Invalid fieldName: ${fieldName} not in ToRadio.oneof`);
    return null;
  }
  const ToRadio = getProtobufs('ToRadio');
  const toRadioMsg = ToRadio.create({ [fieldName]: value });
  const encoded = ToRadio.encode(toRadioMsg).finish();
  return frame(encoded, opts);
}

export function createMeshPacketFrame(type, payload, opts = {}) {
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

export function createAdmminMessageFrame(request, opts = {}) {
  const AdminMessage = getProtobufs('AdminMessage');
  const admin = AdminMessage.create(request);
  const encoded = AdminMessage.encode(admin).finish();

  return createMeshPacketFrame("ADMIN_APP", encoded, opts);
}

// ---------------------------------------------------------------------------------------
// EXtraction
// ---------------------------------------------------------------------------------------

export function extractFramedPayloads(buffer, maxLen = 512) {
  const frames = [];
  let offset = 0;

  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== START1 || buffer[offset + 1] !== START2) {
      offset += 1;
      continue;
    }

    const len = (buffer[offset + 2] << 8) | buffer[offset + 3];
    if (len === 0 || len > maxLen) {
      offset += 1;
      continue;
    }

    if (offset + 4 + len > buffer.length) break;

    const payload = buffer.slice(offset + 4, offset + 4 + len);
    frames.push(payload);

    offset += 4 + len;
  }
// console.log("[extractFramedPayloads] buffer is", buffer);
  const leftover = buffer.slice(offset);
  return { frames, leftover };
}

export const extractNodeInfoPackets = (buffer, maxLen = 512) => {
  const NodeInfo = getProtobufs('NodeInfo');
  const { frames, leftover } = extractFramedPayloads(buffer, maxLen);
  const packets = frames.flatMap(frame => decodeFrame(frame, 'tcp'));

  const nodes = {};
  for (const packet of packets) {
    if (packet.type === 'FromRadio' && packet.payload?.nodeInfo) {
      let info = packet.payload.nodeInfo;

      if (info instanceof Uint8Array) {
        try {
          info = NodeInfo.decode(info);
        } catch (e) {
          console.warn('[extractNodeInfoPackets] Failed to decode nodeInfo buffer:', e);
          continue;
        }
      }

      const nodeId = info.node_num ?? info.num;
      if (nodeId != null) {
        nodes[nodeId] = {
          longName: info.user?.longName,
          shortName: info.user?.shortName,
          lat: info.user?.position?.latitude,
          lon: info.user?.position?.longitude,
          alt: info.user?.position?.altitude,
          battery: info.user?.batteryLevel,
          lastHeard: info.lastHeard,
          hopsAway: info.hopsAway,
          viaMqtt: info.viaMqtt,
          hardwareModel: info.user?.hwModel,
          id: info.user?.id
        };
      } else {
        console.warn('[extractNodeInfoPackets] nodeInfo missing node identifier:', info);
      }
    }
  }

  return { nodes, leftover };
};

export function extractNodeList(buffer) {
  try {
    const FromRadio = getProtobufs('FromRadio');
    const decoded = FromRadio.decode(buffer);
    const nodes = Array.isArray(decoded.nodeInfo) ? decoded.nodeInfo : [];

    return nodes.map((node) => ({
      id: node.user?.id || 'unknown',
      name: node.user?.longName || 'unnamed',
      lat: node.position?.latitude ?? null,
      lon: node.position?.longitude ?? null,
      alt: node.position?.altitude ?? null,
      timestamp: node.position?.time ?? null,
    }));
  } catch (err) {
    console.warn('⚠️ Failed to decode meshtastic.FromRadio.nodeInfo:', err);
    return [];
  }
}

export function buildAdminWantNodesFrame(opts = {}) {
  const AdminMessage = getProtobufs('AdminMessage');
  const admin = AdminMessage.create({ wantNodes: { wantAll: true } });
  const adminBytes = AdminMessage.encode(admin).finish();

  const data = Data.create({
    portnum: PortNum.values.ADMIN,
    payload: adminBytes
  });

  const mesh = MeshPacket.create({
    from: opts.from ?? 0,
    to: opts.to ?? 0,
    channel: opts.channel ?? 0,
    id: opts.id ?? Math.floor(Math.random() * 0xffffffff),
    data
  });

  return buildToRadioFrame('packet', mesh, opts);
}

export function buildAdminGetConfigFrame(opts = {}) {
  // Create an AdminMessage with the getConfigRequest variant
  const AdminMessage = getProtobufs('AdminMessage');
  const admin = AdminMessage.create({ getConfigRequest: {} });
  const adminBytes = AdminMessage.encode(admin).finish();

  // Wrap in a Data message on the ADMIN port
  const data = Data.create({
    portnum: PortNum.values.ADMIN,
    payload: adminBytes
  });

  // Wrap in a MeshPacket
  const mesh = MeshPacket.create({
    from: opts.from ?? 0,
    to: opts.to ?? 0,
    channel: opts.channel ?? 0,
    id: opts.id ?? Math.floor(Math.random() * 0xffffffff),
    data
  });

  // Wrap in a ToRadio.packet and frame it
  return buildToRadioFrame('packet', mesh, opts);
}

export function buildWantTelemetryFrame(opts = {}) {
  // Create an AdminMessage with the telemetry request variant
  const AdminMessage = getProtobufs('AdminMessage');
  const admin = AdminMessage.create({ getTelemetryRequest: {} });
  const adminBytes = AdminMessage.encode(admin).finish();

  // Wrap in a Data message on the ADMIN port
  const data = Data.create({
    portnum: PortNum.values.ADMIN,
    payload: adminBytes
  });

  // Wrap in a MeshPacket
  const mesh = MeshPacket.create({
    from: opts.from ?? 0,
    to: opts.to ?? 0,
    channel: opts.channel ?? 0,
    id: opts.id ?? Math.floor(Math.random() * 0xffffffff),
    data
  });

  // Wrap in a ToRadio.packet and frame it
  return buildToRadioFrame('packet', mesh, opts);
}

/**
 * Safely calls an event handler, with type checking and error logging.
 * @param {Function} fn - The handler to call.
 * @param {string} eventType - The event type (for logging).
 * @param {*} event - The event payload to pass to the handler.
 */
function callHandler(fn, eventType, event) {
  if (typeof fn === 'function') {
    try {
      fn(event);
    } catch (err) {
      console.error(`[SocketInterface] Listener error on ${eventType}:`, err);
    }
  } else {
    console.warn(
      `[SocketInterface] Skipping non-function listener for ${eventType}`,
      fn
    );
  }
}
