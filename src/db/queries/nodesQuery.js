import db from '../db.js';

// --- Node Queries ---
export const listNodesOnly = () => {
  return db.prepare(`
    SELECT num, label, last_seen, viaMqtt, hopsAway, lastHeard
    FROM nodes
    ORDER BY last_seen DESC
  `).all();
};

export const getNode = (num) => {
  return db.prepare(`
    SELECT num, label, last_seen, viaMqtt, hopsAway, lastHeard
    FROM nodes
    WHERE num = ?
  `).get(num);
};

/**
 * List all enriched nodes with metadata and position info.
 * Joins node_users, node_metrics, and positions using schema-defined keys.
 * Returns flat row objects for overlay sync or diagnostics.
 * @returns {Object[]}
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

      u.userId,
      u.longName AS userLongName,
      u.shortName AS userShortName,
      u.macaddr,
      u.hwModel AS userHwModel,
      u.publicKey,
      u.isUnmessagable,
      u.updatedAt AS userUpdatedAt,

      m.lastHeard AS metricsLastHeard,
      m.metrics AS metricsJson,
      m.updatedAt AS metricsUpdatedAt,

      p.latitude AS positionLat,
      p.longitude AS positionLon,
      p.altitude AS positionAlt,
      p.timestamp AS positionTimestamp,
      p.toNodeNum

    FROM nodes n

    LEFT JOIN node_users u ON u.nodeNum = n.num

    LEFT JOIN node_metrics m ON m.nodeNum = n.num
      AND m.updatedAt = (
        SELECT MAX(updatedAt)
        FROM node_metrics
        WHERE nodeNum = n.num
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

export const listChannelsForNode = (num) => {
  return db.prepare(`
    SELECT channel_num, num, name, role
    FROM channels
    WHERE num = ?
    ORDER BY name ASC
  `).all(num);
};

export const listConnectionsForNode = (num) => {
  return db.prepare(`
    SELECT connection_id, transport, status
    FROM connections
    WHERE num = ?
    ORDER BY connection_id ASC
  `).all(num);
};

// Placeholder for future expansion
export const getNodeDetails = (num) => {
  throw new Error('getNodeDetails not yet implemented');
};


export async function getMyInfo() {
  return await db.prepare(`
    SELECT 
      myNodeNum,
      deviceId,
      rebootCount,
      minAppVersion,
      pioEnv,
      currentIP,
      connId,
      timestamp
    FROM my_info
    ORDER BY myNodeNum ASC
  `).all();
}
