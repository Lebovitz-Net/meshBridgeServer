import { decodeMeshPacket } from '../packets/packetMeshDecoder.js';
import { routeMeshDecoded } from './routeMeshDecoded.js';
import { insertHandlers } from '../db/insertHandlers.js';

export function handleMeshIngestion(packet, num, ts) {
  const meshDecoded = decodeMeshPacket(packet);

  if (meshDecoded) {
    routeMeshDecoded(packet, meshDecoded, num, ts);

  } else if (packet.connection) {
    insertHandlers.insertConnection({
      connection_id: packet.connection.id,
      num,
      transport: packet.connection.transport,
      status: packet.connection.status
    });

  } else if (packet.event) {
    insertHandlers.insertEventEmission({
      num,
      event_type: packet.event.type,
      details: JSON.stringify(packet.event.details || {}),
      timestamp: ts
    });

  } else if (packet.channelInfo?.channel_id) {
    insertHandlers.insertChannel({
      channel_id: packet.channelInfo.channel_id,
      num,
      name: packet.channelInfo.name || null
    });

  } else {
    return false;
  }

  return true;
}
