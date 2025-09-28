// src/bridge/packets/decodeFromRadioPacket.js
import protobuf from 'protobufjs';
import protoJson from '../assets/proto.json' with { type: 'json' };

const root = protobuf.Root.fromJSON(protoJson);
const LogRecord = root.lookupType('meshtastic.LogRecord');
const FileInfo = root.lookupType('meshtastic.FileInfo');
const Channel = root.lookupType('meshtastic.Channel');
const QueueStatus = root.lookupType('meshtastic.QueueStatus');
// add others as needed

function decodePayload(type, packet) {
  if (!packet) return packet; // nothing to decode
  try {
    switch (type) {
      case 'logRecord':
        console.log('... decodpayload ', packet.message, Buffer.from(packet.message, 'binary'));
        return { ...packet, decoded: LogRecord.decode(Buffer.from(packet.message, 'binary')) };
      default:
        return packet; // unknown type, leave payload as-is
    }
  } catch (err) {
    console.warn(`[decodeFromRadioPacket] Failed to decode ${type}:`, err);
    return packet;
  }
}

export function decodeFromRadioPacket(subPacket) {
  const { type, data, connId, timestamp, fromNodeNum, toNodeNum, device_id } = subPacket;
  const meta = { connId, timestamp, fromNodeNum, toNodeNum, device_id };

  switch (type) {
    case 'myInfo':
    case 'nodeInfo':
    case 'fileInfo':
    case 'queueStatus':
    case 'channel':
    case 'config':
    case 'moduleConfig':
    case 'clientNotification':
    case 'configComplete':
    case 'configCompleteId':
      // Already decoded upstream
      return { type, data: data ?? {}, meta };

    case 'logRecord': {
      const decodedPacket = decodePayload(type, data);
      return { type, data: decodedPacket, meta };
    }

    default:
      console.warn(`[decodeFromRadioPacket] Unknown FromRadio subtype: ${type}`);
      return null;
  }
}
