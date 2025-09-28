import { packetDecoders } from '../decoder/packetIndex.js';

// --- Decoder Registry ---
function decodeNodeInfo(buffer) {
  return {
    type: 'NodeInfo',
    timestamp: Date.now(),
    payload: {} // TODO: implement actual decode logic
  };
}

function decodePosition(buffer) {
  return {
    type: 'Position',
    timestamp: Date.now(),
    payload: {}
  };
}

function decodeTelemetry(buffer) {
  return {
    type: 'Telemetry',
    timestamp: Date.now(),
    payload: {}
  };
}

function decodeRouting(buffer) {
  return {
    type: 'Routing',
    timestamp: Date.now(),
    payload: {}
  };
}

function decodeConfig(buffer) {
  return {
    type: 'Config',
    timestamp: Date.now(),
    payload: {}
  };
}

function decodeTextMessage(buffer) {
  return {
    type: 'TextMessage',
    timestamp: Date.now(),
    payload: {}
  };
}

function decodeUnknown(buffer) {
  return {
    type: 'Unknown',
    timestamp: Date.now(),
    payload: { raw: buffer }
  };
}

const packetDecoders = {
  NodeInfo: decodeNodeInfo,
  Position: decodePosition,
  Telemetry: decodeTelemetry,
  Routing: decodeRouting,
  Config: decodeConfig,
  TextMessage: decodeTextMessage,
  default: decodeUnknown
};

// --- Type Detection ---
function detectPacketType(buffer) {
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

// --- Categorization Store ---
const store = {};
const lastSeen = {};
const packetStats = {};
const MAX_PACKETS = 100;

// --- Core Categorization ---
function categorizePacket(connId, buffer) {
  const type = detectPacketType(buffer);
  const decoder = packetDecoders[type] || packetDecoders.default;
  const { payload, timestamp } = decoder(buffer);

  const normalized = normalizePayload(type, payload);

  if (!store[type]) store[type] = {};
  if (!store[type][connId]) store[type][connId] = [];

  store[type][connId].push({ type, connId, timestamp, payload: normalized });

  pruneStore(type, connId);
  updateLastSeen(type, connId, timestamp);
  incrementStats(type, connId);

  if (type === 'Unknown') {
    console.warn(`[Unknown Packet] connId=${connId}`, buffer);
  }
}

// --- Accessors ---
function getPacketsByType(type, connId) {
  if (!store[type]) return [];
  return connId ? store[type][connId] || [] : Object.values(store[type]).flat();
}

function getLastSeen(type, connId) {
  return lastSeen[type]?.[connId] || null;
}

function getPacketStats() {
  return packetStats;
}

// --- Helpers ---
function updateLastSeen(type, connId, timestamp) {
  if (!lastSeen[type]) lastSeen[type] = {};
  lastSeen[type][connId] = timestamp;
}

function incrementStats(type, connId) {
  const key = `${type}:${connId}`;
  packetStats[key] = (packetStats[key] || 0) + 1;
}

function pruneStore(type, connId) {
  const list = store[type][connId];
  if (list.length > MAX_PACKETS) {
    store[type][connId] = list.slice(-MAX_PACKETS);
  }
}

function normalizePayload(type, payload) {
  switch (type) {
    case 'Telemetry':
      return {
        voltage: payload.voltage ?? null,
        uptime: payload.uptime ?? null,
        temperature: payload.temperature ?? null,
        humidity: payload.humidity ?? null
      };
    case 'Position':
      return {
        lat: payload.lat ?? null,
        lon: payload.lon ?? null,
        altitude: payload.altitude ?? null,
        battery: payload.battery ?? null
      };
    default:
      return payload;
  }
}

// --- Exports ---
export {
  categorizePacket,
  getPacketsByType,
  getLastSeen,
  getPacketStats,
  detectPacketType
};
