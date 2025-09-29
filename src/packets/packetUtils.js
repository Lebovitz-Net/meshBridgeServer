const DEFAULT_SKIP_KEYS = ['payload', 'data', 'message'];

export function normalizeBuffers(obj, path = [], skipKeys = DEFAULT_SKIP_KEYS, encoding = 'hex') {
  if (Buffer.isBuffer(obj)) {
    const lastKey = path[path.length - 1];
    if (skipKeys.includes(lastKey)) {
      return obj; // preserve raw buffer for decoding
    }
    return obj.toString(encoding);
  }

  if (Array.isArray(obj)) {
    return obj.map((item, i) => normalizeBuffers(item, [...path, i], skipKeys, encoding));
  }

  if (obj !== null && typeof obj === 'object') {
    const result = {};
    for (const key of Object.keys(obj)) {
      result[key] = normalizeBuffers(obj[key], [...path, key], skipKeys, encoding);
    }
    return result;
  }

  return obj;
}

export function parsePlainMessage(buffer) {
  try {
    return buffer.toString('utf-8');
  } catch (err) {
    console.warn('[parsePlainMessage] Failed to parse buffer:', err);
    return null;
  }
}

export function extractChannelInfo(packet) {
  const channel_id = packet?.decoded?.channel_id ?? packet?.channel?.id ?? null;
  return channel_id ? { channel_id } : null;
}

/**
 * Extracts valid oneof subtypes from a decoded packet entry.
 * Uses the sourceType to determine which proto message to inspect.
 *
 * @param {Object} entry - The decoded packet object
 * @param {string} sourceType - Either 'fromRadio' or 'meshPacket'
 * @param {Object} protoJson - The loaded proto.json schema
 * @returns {string[]} - List of oneof keys present in the entry
 */
function extractOneofSubtypes(entry, sourceType, protoJson) {
  const typeMap = {
    fromRadio: 'meshtastic.FromRadio',
    meshPacket: 'meshtastic.MeshPacket',
  };

  const messageType = typeMap[sourceType];
  if (!messageType || !protoJson[messageType]) {
    console.warn(`Unknown sourceType or missing proto definition: ${sourceType}`);
    return [];
  }

  const oneofFields = protoJson[messageType].oneof || [];
  const presentKeys = [];

  for (const oneofGroup of oneofFields) {
    for (const fieldName of oneofGroup.oneof) {
      if (entry[fieldName] !== undefined) {
        presentKeys.push(fieldName);
      }
    }
  }

  return presentKeys;
}

// PacketUtils.js

/**
 * Constructs a normalized subpacket object for routing.
 * Combines canonical metadata with the embedded subtype payload.
 *
 * @param {Object} entry - The decoded packet entry
 * @param {string} subtype - The oneof key (e.g., 'nodeInfo', 'logRecord')
 * @returns {Object} - Enriched subpacket object
 */
function constructSubPacket(entry, subtype) {
  if (!entry || !entry[subtype]) {
    console.warn(`Missing subtype payload: ${subtype}`);
    return null;
  }

  const {
    fromNodeNum,
    toNodeNum,
    rxTime,
    connId,
    transportType,
    raw,
    channelNum,
    hopLimit,
    portNum,
    rxSnr,
    rxRssi,
    rxDeviceId,
    rxGatewayId,
    rxSessionId,
    decodedBy,
    tags,
  } = entry;

  return {
    type: subtype,
    fromNodeNum,
    toNodeNum,
    rxTime,
    connId,
    transportType,
    raw,
    channelNum,
    hopLimit,
    portNum,
    rxSnr,
    rxRssi,
    rxDeviceId,
    rxGatewayId,
    rxSessionId,
    decodedBy,
    tags,
    data: entry[subtype],
  };
}

// PacketUtils.js

/**
 * Normalizes decoded packet(s) into enriched subpacket objects.
 * Handles single or array input, extracts canonical fields,
 * identifies oneof subtypes, and constructs dispatchable objects.
 *
 * @param {Object|Object[]} decoded - Decoded packet(s) from PacketDecoder
 * @param {Object} protoJson - Loaded proto.json schema
 * @returns {Object[]} - Array of normalized subpacket objects
 */
function normalizeDecodedPacket(decoded, protoJson) {
  const entries = Array.isArray(decoded) ? decoded : [decoded];
  const subPackets = [];

  for (const entry of entries) {
    const { sourceType } = entry;
    if (!sourceType) {
      console.warn('Missing sourceType in decoded entry');
      continue;
    }

    const canonicalFields = extractCanonicalFields(entry);
    const subtypes = extractOneofSubtypes(entry, sourceType, protoJson);

    for (const subtype of subtypes) {
      const subPacket = constructSubPacket({ ...entry, ...canonicalFields }, subtype);
      if (subPacket) subPackets.push(subPacket);
    }
  }
  return subPackets;
}
