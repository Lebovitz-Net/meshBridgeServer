// MeshCore/packetEncoder.js

/**
 * Encodes a Packet instance into a raw byte frame.
 * Assumes Packet has: header (1 byte), path (variable), payload (variable)
 */

export function encode(packet) {
  if (!packet || typeof packet !== 'object') {
    throw new Error('Invalid packet: must be a Packet instance');
  }

  const headerBuf = Buffer.from([packet.header]);

  const pathLen = packet.path?.length || 0;
  const pathLenBuf = Buffer.from([pathLen]);

  const pathBuf = Buffer.isBuffer(packet.path)
    ? packet.path
    : Buffer.from(packet.path || []);

  const payloadBuf = Buffer.isBuffer(packet.payload)
    ? packet.payload
    : Buffer.from(packet.payload || []);

  return Buffer.concat([headerBuf, pathLenBuf, pathBuf, payloadBuf]);
}
