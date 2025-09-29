// src/bridge/packets/decodeMeshPacket.js

import protobuf from 'protobufjs';
import protoJson from '../assets/proto.json' with { type: 'json' };
import { decompress } from '../utils/decompressUtils.js';
import { parsePlainMessage, extractChannelInfo } from './packetUtils.js';

const root = protobuf.Root.fromJSON(protoJson);
const Position = root.lookupType('meshtastic.Position');
const Telemetry = root.lookupType('meshtastic.Telemetry');
const User = root.lookupType('meshtastic.User');

/**
 * Normalize return shape:
 * {
 *   type: 'position' | 'message' | 'nodeInfo' | 'telemetry' | 'adminMessage',
 *   data: { ...decoded fields... },
 *   meta: { fromNodeNum, toNodeNum, packetId, timestamp, viaMqtt, hopStart, channelInfo? }
 * }
 */
export function decodeMeshPacket(packet) {
  const port = packet?.decoded?.portnum;
  const payload = packet?.decoded?.payload;

  if (!port || !payload) return null;

  const baseMeta = {
    packetId: packet.id,
    fromNodeNum: packet.from,
    toNodeNum: packet.to,
    timestamp: packet.rxTime ? new Date(packet.rxTime * 1000) : Date.now(),
    viaMqtt: packet.viaMqtt,
    hopStart: packet.hopStart,
  };

  switch (port) {
    case 1: { // Plain text message
      const message = parsePlainMessage(payload);
      return message
        ? { type: 'message', data: { text: message }, meta: { ...baseMeta, channelInfo: extractChannelInfo(packet) } }
        : null;
    }

    case 7: { // Compressed message
      try {
        const decompressed = decompress(payload);
        if (!decompressed) return null;
        const message = parsePlainMessage(decompressed);
        return message
          ? { type: 'message', data: { text: message }, meta: { ...baseMeta, channelInfo: extractChannelInfo(packet) } }
          : null;
      } catch (err) {
        console.warn('[decodeMeshPacket] Port 7 decompression failed:', err);
        return null;
      }
    }

    case 3: { // Position
      try {
        const position = Position.decode(payload);
        return {
          type: 'position',
          data: {
            latitude: position.latitudeI / 1e7,
            longitude: position.longitudeI / 1e7,
            altitude: position.altitude ?? null,
            batteryLevel: position.batteryLevel ?? null,
            toNodeNum: baseMeta.toNodeNum,
            fromNodeNum: baseMeta.fromNodeNum,
          },
          meta: baseMeta,
        };
      } catch (err) {
        console.warn('[decodeMeshPacket] Failed to decode Position:', err);
        return null;
      }
    }

    case 4: { // NodeInfo
      try {
        const user = User.decode(payload);
        return {
          type: 'nodeInfo',
          data: {
            id: user.id,
            longName: user.longName,
            shortName: user.shortName,
            hwModel: user.hwModel,
          },
          meta: baseMeta,
        };
      } catch (err) {
        console.warn('[decodeMeshPacket] Failed to decode NodeInfo:', err);
        return null;
      }
    }

    case 5: { // AdminMessage (placeholder)
      return { type: 'adminMessage', data: { ignored: true }, meta: baseMeta };
    }

    case 67: { // Telemetry
      try {
        const telemetry = Telemetry.decode(payload);
        return {
          type: 'telemetry',
          data: {
            voltage: telemetry.voltage,
            channelUtilization: telemetry.channelUtilization,
            airUtilTx: telemetry.airUtilTx,
          },
          meta: baseMeta,
        };
      } catch (err) {
        console.warn('[decodeMeshPacket] Failed to decode Telemetry:', err);
        return null;
      }
    }

    default:
      console.warn(`[decodeMeshPacket] Unknown port ${port}, skipping`);
      return null;
  }
}
