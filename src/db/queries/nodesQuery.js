import db from '../dbschema.js';

// --- nodesQuery.js ---
export const placeholderQuery = () => 'Query handler ready';
// --- Node Queries ---
export const listNodes = () => {
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

export const listChannelsForNode = (num) => {
  return db.prepare(`
    SELECT channel_id, name
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
