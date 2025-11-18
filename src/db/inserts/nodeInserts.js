// --- Node Inserts ---
import db from '../db.js';
import { emitNodeUpdate } from '../../Meshtastic/utils/sseEmitters.js';


// insertNode ===========================================
export const insertNode = (node, timestamp = Date.now()) => {
  if (!node?.num) {
    console.warn('[insertNode] Skipping insert: node.num is missing');
    return;
  }

  db.prepare(`
    INSERT INTO nodes (num, label, last_seen, viaMqtt, hopsAway, lastHeard, device_id)
    VALUES (@num, @label, @last_seen, @viaMqtt, @hopsAway, @lastHeard, @device_id)
    ON CONFLICT(num) DO UPDATE SET
      label = excluded.label,
      last_seen = excluded.last_seen,
      viaMqtt = excluded.viaMqtt,
      hopsAway = excluded.hopsAway,
      lastHeard = excluded.lastHeard,
      device_id = excluded.device_id
  `).run({
    fromNodeNum: node.num,
    label: node.label ?? null,
    last_seen: node.last_seen ?? timestamp,
    viaMqtt: node.viaMqtt ? 1 : 0,
    hopsAway: node.hopsAway ?? null,
    lastHeard: node.lastHeard ?? null,
    device_id: node.device_id ?? null
  });
};




// insertNodeMetrics ===========================================
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

// insertPosition ===========================================

export function insertPosition(decoded) {
  const { fromNodeNum, toNodeNum, latitude, longitude, altitude, timestamp } = decoded;
  const ts = timestamp ?? Date.now();

  db.prepare(`
    INSERT INTO positions (fromNodeNum, toNodeNum, latitude, longitude, altitude, timestamp)
    VALUES (@fromNodeNum, @latitude, @longitude, @altitude, @ts)
  `).run({
    fromNodeNum,
    latitude: Number(latitude),
    longitude: Number(longitude),
    altitude: altitude != null ? Number(altitude) : null,
    ts
  });
}

// UpsertNodeInfo ===========================================
export const upsertNodeInfo = (packet) => {
  const { nodeInfo, user, position, deviceMetrics } = packet;
  const num = nodeInfo?.num;

  if (!num) {
    console.warn('[upsertNodeInfo] Skipping: nodeInfo.num is missing', nodeInfo);
    return null;
  }

  const tx = db.transaction(() => {
    insertNode({
       ...nodeInfo,
    });

    if (user.id) {
      insertUsers(user, num);
    }

    if (deviceMetrics != null) {
      insertNodeMetrics(nodeInfo, {
        ...deviceMetrics
      });
    }

    if (position) {on;
       console.log('.../nodesInsert upsertNodes position');
       insertPosition({
         ...position,
       })
    }

      // 🔥 Emit SSE update after successful insert/update
    emitNodeUpdate({
      ...nodeInfo
    });

  return { num };
  });
  tx();
}
