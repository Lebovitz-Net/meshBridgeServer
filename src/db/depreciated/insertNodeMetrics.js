import db from './dbschema.js';

/**
 * Inserts or updates a node's runtime metrics into node_metrics.
 *
 * @param {Object} deviceMetrics - The metrics object from NodeInfo
 * @param {Object} options - { num: nodeNum, lastHeard?: number }
 */
export function insertNodeMetrics(deviceMetrics, { num, lastHeard = Date.now() }) {


  db.prepare(`
    INSERT INTO node_metrics (
      nodeNum, lastHeard, metrics, updatedAt
    ) VALUES (
      @nodeNum, @lastHeard, @metrics, @updatedAt
    )
    ON CONFLICT(nodeNum) DO UPDATE SET
      lastHeard = excluded.lastHeard,
      metrics = excluded.metrics,
      updatedAt = excluded.updatedAt
  `).run({
    nodeNum: num,
    lastHeard,
    metrics: JSON.stringify(deviceMetrics),
    updatedAt: Date.now()
  });
}
