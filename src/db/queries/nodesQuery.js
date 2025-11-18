import db from '../db.js';

// --- Node Queries ---

// Lightweight list of nodes
export const listNodesOnly = () => {
  return db.prepare(`
    SELECT num, label, last_seen, viaMqtt, hopsAway, lastHeard
    FROM nodes
    ORDER BY last_seen DESC
  `).all();
};

// Single node lookup
export const getNode = (num) => {
  return db.prepare(`
    SELECT num, label, last_seen, viaMqtt, hopsAway, lastHeard, device_id
    FROM nodes
    WHERE num = ?
  `).get(num);
};

/**
 * List all enriched nodes with metadata and position info.
 * Joins users, device_metrics, and positions using schema-defined keys.
 * Returns flat row objects for overlay sync or diagnostics.
 */
export function listNodes() {
  const query = `
    SELECT
      n.num AS nodeNum,
      n.label,
      n.device_id,
      n.last_seen,
      n.viaMqtt,
      n.hopsAway,
      n.lastHeard,

      u.contactId,
      u.name AS userName,
      u.shortName AS userShortName,
      u.publicKey,
      u.timestamp AS userTimestamp,
      u.protocol AS userProtocol,
      u.options AS userOptions,
      u.position AS userPosition,

      m.timestamp AS metricsTimestamp,
      m.batteryLevel,
      m.txPower,
      m.uptime,
      m.cpuTemp,
      m.memoryUsage,

      p.latitude AS positionLat,
      p.longitude AS positionLon,
      p.altitude AS positionAlt,
      p.timestamp AS positionTimestamp,
      p.toNodeNum

    FROM nodes n

    LEFT JOIN users u ON u.nodeNum = n.num

    LEFT JOIN device_metrics m ON m.fromNodeNum = n.num
      AND m.timestamp = (
        SELECT MAX(timestamp)
        FROM device_metrics
        WHERE fromNodeNum = n.num
      )

    LEFT JOIN positions p ON p.fromNodeNum = n.num
      AND p.timestamp = (
        SELECT MAX(timestamp)
        FROM positions
        WHERE fromNodeNum = n.num
      );
  `;
  return db.prepare(query).all();
}

// --- Channels ---

// Channels scoped to a node
export const listChannelsForNode = (num) => {
  return db.prepare(`
    SELECT channelNum, nodeNum, name, role
    FROM channels
    WHERE nodeNum = ?
    ORDER BY name ASC
  `).all(num);
};

// Unified channels list
export const listChannels = () => {
  return db.prepare(`
    SELECT channelNum, nodeNum, name, role
    FROM channels
    ORDER BY name ASC
  `).all();
};

// --- Connections ---

// Connections scoped to a node
export const listConnectionsForNode = (num) => {
  return db.prepare(`
    SELECT connection_id, transport, status
    FROM connections
    WHERE num = ?
    ORDER BY connection_id ASC
  `).all(num);
};

// Unified connections list
export const listConnections = () => {
  return db.prepare(`
    SELECT connection_id, transport, status
    FROM connections
    ORDER BY connection_id ASC
  `).all();
};

// --- Node Details ---

export const getNodeDetails = (num) => {
  const node = getNode(num);
  const channels = listChannelsForNode(num);
  const connections = listConnectionsForNode(num);
  return { ...node, channels, connections };
};

// --- My Info ---

/**
 * Get information about the current node/device.
 * Values like deviceId, rebootCount, minAppVersion, pioEnv are stored in options JSON.
 */
export function getMyInfo() {
  return db.prepare(`
    SELECT 
      myNodeNum,
      name,
      shortname,
      type,
      options,
      publicKey,
      protocol,
      currentIP,
      connId,
      timestamp
    FROM my_info
    ORDER BY myNodeNum ASC
  `).all();
}
