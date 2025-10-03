import db from './dbschema.js';

export const insertNode = (node, timestamp = Date.now()) => {
  if (!node?.num) {
    console.warn('[insertNode] Skipping insert: node.num is missing');
    return;
  }

  db.prepare(`
    INSERT INTO nodes (
      num,
      label,
      last_seen,
      viaMqtt,
      hopsAway,
      lastHeard,
      device_id
    )
    VALUES (
      @num,
      @label,
      @last_seen,
      @viaMqtt,
      @hopsAway,
      @lastHeard,
      @device_id
    )
    ON CONFLICT(num) DO UPDATE SET
      label = excluded.label,
      last_seen = excluded.last_seen,
      viaMqtt = excluded.viaMqtt,
      hopsAway = excluded.hopsAway,
      lastHeard = excluded.lastHeard,
      device_id = excluded.device_id
  `).run({
    num: node.num,
    label: node.label ?? null,
    last_seen: node.last_seen ?? timestamp,
    viaMqtt: node.viaMqtt ? 1 : 0,
    hopsAway: node.hopsAway ?? null,
    lastHeard: node.lastHeard ?? null,
    device_id: node.device_id ?? null
  });
};
