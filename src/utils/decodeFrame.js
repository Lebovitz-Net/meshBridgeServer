import protobuf from 'protobufjs';
import protoDef from '../assets/proto.json' with { type: 'json' }
import { extractFramedPayloads } from './protoHelpers.js';

const root = protobuf.Root.fromJSON(protoDef);

const MeshPacket = root.lookupType('meshtastic.MeshPacket');
const ToRadio = root.lookupType('meshtastic.ToRadio');
const FromRadio = root.lookupType('meshtastic.FromRadio');
const Data = root.lookupType('meshtastic.Data');

export function decodeFrame(buffer, source = 'unknown') {
  const { frames, leftovers } = extractFramedPayloads(buffer);
  const decodedPackets = [];

  for (const frame of frames) {
    try {
      console.log("[decodeFrame] frame is", frame);
      const meshPacket = MeshPacket.decode(frame);
      // console.log("[decodeFrame] meshPacket is ", meshPacket);
      // const subPacket = extractSubPacket(meshPacket);

      // decodedPackets.push({
      //   type: subPacket.type,
      //   nodeId: meshPacket.from ?? 'unknown',
      //   payload: subPacket.payload,
      //   raw: meshPacket,
      //   source,
      // });
    } catch (err) {
      console.warn(`[${source}] Failed to decode frame:`, err);
    }
  }

  return frames;
}

function extractSubPacket(meshPacket) {
  if (meshPacket.toRadio) {
    try {
      const decoded = ToRadio.decode(meshPacket.toRadio);
      return { type: 'ToRadio', payload: decoded };
    } catch (err) {
      console.warn('Failed to decode ToRadio:', err);
    }
  }

  if (meshPacket.fromRadio) {
    try {
      const decoded = FromRadio.decode(meshPacket.fromRadio);
      return { type: 'FromRadio', payload: decoded };
    } catch (err) {
      console.warn('Failed to decode FromRadio:', err);
    }
  }

  if (meshPacket.data) {
    try {
      const decoded = Data.decode(meshPacket.data);
      return { type: 'Data', payload: decoded };
    } catch (err) {
      console.warn('Failed to decode Data:', err);
    }
  }

  return { type: 'Unknown', payload: meshPacket };
}
