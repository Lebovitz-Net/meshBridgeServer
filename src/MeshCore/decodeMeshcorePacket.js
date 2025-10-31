import Packet from './packet.js';

import { Decoders } from '../../external/meshcore.js/src/packet.js'; // your existing class
import { DecodedPacket } from './types'; // optional: your structured output type

export function tryDecodeAll(buffer, meta = {}) {
  const stripped = unFrame(buffer); // your framing logic

  for (const [type, decodeFn] of Object.entries(Decoders)) {
    if (typeof decodeFn !== 'function') continue;

    try {
      const payload = decodeFn(stripped);
      if (!payload || Object.keys(payload).length === 0) continue;

      return {
        type,        // inferred message type (e.g. 'SelfInfoResponse')
        payload,     // decoded object
        raw: stripped, // original buffer
        ...meta      // connId, timestamp, etc
      };
    } catch (err) {
      continue; // silent fail — decoder mismatch
    }
  }

  return {
    type: 'Unknown',
    payload: null,
    raw: stripped,
    ...meta
  };
}



export function decodePacketWithMessageType(frame, meta = {}) {
  const packet = Packet.fromBytes(frame);

  const base = {
    route_type: packet.route_type_string,
    payload_type: packet.payload_type_string,
    payload_version: packet.payload_version,
    connId: meta.connId,
    timestamp: meta.timestamp,
    source: meta.source || 'meshcore',
  };

  // Try to decode the inner payload
  const decoded = tryDecodeAll(packet.payload, base);

  return {
    ...base,
    message_type: decoded.type,     // e.g. 'SelfInfoResponse'
    payload: decoded.payload,       // decoded object
    raw: decoded.raw || packet.payload, // raw buffer if unknown
  };
}
