import db from './dbschema.js';
import { insertHandlers } from './depreciated/insertHandlers_old.js'

/**
 * Upserts a full nodeInfo payload into nodes, node_users, and node_metrics.
 * Runs in a single transaction for atomicity.
 *
 * @param {Object} nodeInfo - The decoded NodeInfo object
 * @returns {Object} - { num } for downstream inserts
 */
export const upsertNodeInfo = (nodeInfo) => {
  const num = nodeInfo?.num;

  if (!num) {
    console.warn('[upsertNodeInfo] Skipping: nodeInfo.num is missing', nodeInfo);
    return null;
  }

  const tx = db.transaction(() => {
    // Insert into nodes table
    insertHandlers.insertNode({
      num,
      label: nodeInfo.user?.longName ?? null,
      last_seen: nodeInfo.lastHeard ?? Date.now(),
      viaMqtt: nodeInfo.viaMqtt,
      hopsAway: nodeInfo.hopsAway,
      lastHeard: nodeInfo.lastHeard
    });

    // Insert into node_users table
    if (nodeInfo.user) {
      insertHandlers.insertNodeUsers(nodeInfo.user, num);
    }

    // Insert into node_metrics table
    if (nodeInfo.deviceMetrics) {
      insertHandlers.insertNodeMetrics(nodeInfo.deviceMetrics, {
        num,
        lastHeard: nodeInfo.lastHeard
      });
    }
  });

  tx();
  return { num };
};
