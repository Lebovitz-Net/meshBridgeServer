import protobuf from 'protobufjs';
import protoJson from '../assets/proto.json' with { type: 'json' };

const root = protobuf.Root.fromJSON(protoJson);

function tryDecode(type, buffer) {
  try {
    decoder  = root.lookupType(`meshtastic.${type}`);
    return decoder.decode((buffer));
  } catch {
    return null;
  }
}

export function decodePacket(parent, packet) {
    let result = {}

    const data = Buffer.isBuffer(packet)
      ? tryDecode(parent, packet)
      : packet;

    if (!data) return;

    if (typeof data === 'object') {

        for (const [key, value] of Object.entries(data)) {
            result = { ...result, ...decodeSubPacket(key, value) };
        }
        return result;

    } else {
        return { [parent]: data };
    }
}
