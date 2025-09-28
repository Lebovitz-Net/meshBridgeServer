import { decodeNodeInfo } from './decodeNodeInfo.js';
import { decodePosition } from './decodePosition.js';
import { decodeTelemetry } from './decodeTelemetry.js';
import { decodeRouting } from './decodeRouting.js';
import { decodeConfig } from './decodeConfig.js';
import { decodeTextMessage } from './decodeTextMessage.js';

export const packetDecoders = {
  NodeInfo: decodeNodeInfo,
  Position: decodePosition,
  Telemetry: decodeTelemetry,
  Routing: decodeRouting,
  Config: decodeConfig,
  TextMessage: decodeTextMessage,
  default: (buffer) => ({
    type: 'Unknown',
    timestamp: Date.now(),
    payload: { raw: buffer }
  })
};

// 🧠 Inline type detection logic
export function detectPacketType(buffer) {
  // Example stub: replace with actual logic
  // If using protobuf, inspect the first byte or header field
  try {
    const headerByte = buffer[0];
    switch (headerByte) {
      case 0x01: return 'NodeInfo';
      case 0x02: return 'Position';
      case 0x03: return 'Telemetry';
      case 0x04: return 'Routing';
      case 0x05: return 'Config';
      case 0x06: return 'TextMessage';
      default: return 'Unknown';
    }
  } catch (err) {
    return 'Unknown';
  }
}
