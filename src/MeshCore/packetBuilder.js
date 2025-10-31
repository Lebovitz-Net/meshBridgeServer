// MeshCore/packetBuilder.js

import Packet from '../../external/meshcore.js/src/packet.js'; // Canonical class from MeshCore.dev

// 🔹 Build a WANT_CONFIG request packet
export function wantConfig(destHash, srcHash) {
  const opcode = Buffer.from([OPCODES.WANT_CONFIG]); // 0x01
  const encryptedBlob = buildEncryptedBlob(opcode); // placeholder for encryption logic

  const payload = Buffer.concat([
    Buffer.from([destHash]), // 1 byte
    Buffer.from([srcHash]),  // 1 byte
    encryptedBlob            // variable length
  ]);

  const header = buildHeader({
    routeType: 'DIRECT',
    payloadType: 'REQ',
    version: 1
  });

  return new Packet(header, Buffer.alloc(0), payload);
}

// 🔹 Build an ADVERT packet
export function advert(publicKey, timestamp, appData) {
  const advertPayload = buildAdvertPayload(publicKey, timestamp, appData);

  const header = buildHeader({
    routeType: 'FLOOD',
    payloadType: 'ADVERT',
    version: 1
  });

  return new Packet(header, Buffer.alloc(0), advertPayload);
}

// 🔹 Build a generic ACK packet
export function ack(code = 0x00) {
  const payload = Buffer.from([code]);

  const header = buildHeader({
    routeType: 'DIRECT',
    payloadType: 'ACK',
    version: 1
  });

  return new Packet(header, Buffer.alloc(0), payload);
}

// 🔹 Header builder (shared with encoder)
function buildHeader({ routeType, payloadType, version }) {
  const ROUTE_TYPE = {
    RESERVED1: 0x00,
    FLOOD: 0x01,
    DIRECT: 0x02,
    RESERVED2: 0x03
  };

  const PAYLOAD_TYPE = {
    REQ: 0x00,
    RESPONSE: 0x01,
    TXT_MSG: 0x02,
    ACK: 0x03,
    ADVERT: 0x04,
    GRP_TXT: 0x05,
    GRP_DATA: 0x06,
    ANON_REQ: 0x07,
    PATH: 0x08,
    TRACE: 0x09,
    RAW_CUSTOM: 0x0F
  };

  let header = 0;
  header |= ROUTE_TYPE[routeType] & 0x03;
  header |= (PAYLOAD_TYPE[payloadType] & 0x0F) << 2;
  header |= (version & 0x03) << 6;
  return header;
}

// 🔹 Opcodes (expand as needed)
const OPCODES = {
  WANT_CONFIG: 0x01,
  SEND_NODE_INFO: 0x02,
  SUBSCRIBE: 0x03,
  UNSUBSCRIBE: 0x04
};

// 🔹 Placeholder: build encrypted blob
function buildEncryptedBlob(opcodeBuffer) {
  // TODO: implement encryption if needed
  return opcodeBuffer;
}

// 🔹 Placeholder: build ADVERT payload
function buildAdvertPayload(publicKey, timestamp, appData) {
  // TODO: serialize advert fields
  return Buffer.concat([
    Buffer.from(publicKey),         // 32 bytes
    Buffer.from(timestamp.toString()), // placeholder
    Buffer.from(appData || '')      // optional
  ]);
}

// 🔹 Build a TEXT message packet
export function buildTextMessage(destHash, srcHash, text) {
  // Encode the text as UTF-8
  const textBuffer = Buffer.from(text, 'utf8');

  // Payload layout (example):
  // [ destHash (1 byte) | srcHash (1 byte) | textLength (1 byte) | text (N bytes) ]
  const payload = Buffer.concat([
    Buffer.from([destHash & 0xFF]),   // 1 byte
    Buffer.from([srcHash & 0xFF]),    // 1 byte
    Buffer.from([textBuffer.length]), // 1 byte length prefix
    textBuffer                        // variable length
  ]);

  // Build header: DIRECT route, TXT_MSG payload
  const header = buildHeader({
    routeType: 'DIRECT',
    payloadType: 'TXT_MSG',
    version: 1
  });

  // Return canonical Packet
  return new Packet(header, Buffer.alloc(0), payload);
}

// 🔹 Request Node Info
export function requestNodeInfo(destHash, srcHash) {
  const opcode = Buffer.from([OPCODES.SEND_NODE_INFO]);
  const payload = Buffer.concat([
    Buffer.from([destHash & 0xFF]),
    Buffer.from([srcHash & 0xFF]),
    opcode
  ]);

  const header = buildHeader({
    routeType: 'DIRECT',
    payloadType: 'REQ',
    version: 1
  });

  return new Packet(header, Buffer.alloc(0), payload);
}

// 🔹 Request Telemetry
export function requestTelemetry(destHash, srcHash) {
  const opcode = Buffer.from([OPCODES.SUBSCRIBE]); // subscribe to telemetry
  const payload = Buffer.concat([
    Buffer.from([destHash & 0xFF]),
    Buffer.from([srcHash & 0xFF]),
    opcode
  ]);

  const header = buildHeader({
    routeType: 'DIRECT',
    payloadType: 'REQ',
    version: 1
  });

  return new Packet(header, Buffer.alloc(0), payload);
}

// 🔹 Request Position
export function requestPosition(destHash, srcHash) {
  // Using TRACE payload type (0x09)
  const payload = Buffer.concat([
    Buffer.from([destHash & 0xFF]),
    Buffer.from([srcHash & 0xFF])
  ]);

  const header = buildHeader({
    routeType: 'DIRECT',
    payloadType: 'TRACE',
    version: 1
  });

  return new Packet(header, Buffer.alloc(0), payload);
}

// 🔹 Want Config (ID variant)
export function wantConfigId(destHash, srcHash) {
  return wantConfig(destHash, srcHash);
}
