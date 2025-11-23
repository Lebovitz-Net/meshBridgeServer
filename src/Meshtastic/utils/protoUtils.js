import protobuf from 'protobufjs';
import protoJson from '../proto.json' with { type: 'json' };
import { getChannelMapping } from '../routing/nodeMapping.js';
import crypto from 'crypto';
import os from 'os';

export const START1 = 0x94;
export const START2 = 0xc3;

const root = protobuf.Root.fromJSON(protoJson);
const meshMap = new Map;

const topLevelProtos = protoJson.nested.meshtastic.nested;
const sortOrder = (val) => {
  switch(val) {
    case 'FromRadio': return 0;
    case 'ToRadio': return 2;
    case 'MeshPacket': return 3;
    case 'Config': return 4;
    case 'ModuleConfig': return 5;
    default: return 30;
  }
}
const meshProtoTypes = Object.keys(topLevelProtos)
                            .filter((value) => topLevelProtos[value]?.oneofs?.payloadVariant)
                            .sort((a, b) => sortOrder(a) - sortOrder(b));


export async function initProtoTypes () {

  meshProtoTypes.map((type) => {
     meshMap.set(type, root.lookupType(`meshtastic.${type}`));
  });
}

export const getProtobufs = (key) => meshMap.get(key);
export const getProtobufOneofs = (type) => getProtobufs(type)?.oneofs?.payloadVariant?.oneof ?? null;
export const getProtobufTypes = (type) => {
  const oneofs = getProtobufOneofs(type);
  return oneofs ?  new Set (oneofs) : null;
}
export const getDecodeTypes = () => meshMap;

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
  const header = [START1, START2, (len >> 8) & 0xff, len & 0xff];

  // Use spread to merge header and bytes, then wrap in Uint8Array
  return new Uint8Array([...header, ...bytes]);
}


export function unFrame(buf) {
  return buf?.[0] === START1 && buf?.[1] === START2 ? buf.subarray(2) : buf;
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

