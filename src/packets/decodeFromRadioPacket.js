import protobuf from 'protobufjs';
import protoJson from '../assets/proto.json' with { type: 'json' };
import { decodeMeshPacket } from './decodeMeshPacket.js';
import { decompress } from '../utils/decompressUtils.js';
import { getMapping } from '../core/connectionManager.js';

const root = protobuf.Root.fromJSON(protoJson);
const LogRecord = root.lookupType('meshtastic.LogRecord');

function tryDecodeLogRecord(rawSource) {
  const sourceBuf = Buffer.from(rawSource, 'binary');

  const nestedTypes = Object.values(root.nested)
    .flatMap(ns => ns.nested ? Object.keys(ns.nested).map(k => `${ns.name}.${k}`) : [])
    .filter(typeName => root.lookupTypeOrEnum(typeName)?.decode);

  for (const typeName of nestedTypes) {
    try {
      const MessageType = root.lookupType(typeName);
      const decoded = MessageType.decode(sourceBuf);
      console.log(`✅ Decoded as ${typeName}:`, decoded);
      return decoded;
    } catch (_) {
      // silently skip failed attempts
    }
  }

  console.log("❌ No matching nested type could decode the source buffer.");
  console.log("📦 Raw source buffer (hex):", sourceBuf.toString('hex'));
  console.log("📦 Raw source buffer (base64):", sourceBuf.toString('base64'));
}



// --- Payload Decoder ---
function decodePayload(type, data) {
  switch (type) {
    case 'logRecord':
      if (!data?.message) return data;
        let buf = Buffer.from(data.message, 'binary');
        if (buf[0] === 0x15) {
          buf = buf.slice(4);
        }
      try {
        return { ...data, decoded: LogRecord.decode(buf) };
      } catch (err) {
        console.warn(`[decodePayload] Failed to decode logRecord:`, buf, data?.message);
        return data;
      }

    default:
      return data;
  }
}

// --- Unified Decode Entry Point ---
export function decodeFromRadioPacket(type, value, meta = {}) {

  switch (type) {
    case 'packet': {
      const decoded = decodeMeshPacket(value);
      if (!decoded) {
        console.warn('[decodeFromRadioPacket] Failed to decode MeshPacket');
        return null;
      }
      return {
        ...decoded,
        meta, // re-enrich with decoded fields
        sourcePacket: 'packet',
      };
    }

    case 'logRecord': {
      const decodedData = decodePayload(type, value);
      return { type, data: decodedData, meta };
    }

    default:
      return { type, data: value ?? {}, meta };
  }
}
