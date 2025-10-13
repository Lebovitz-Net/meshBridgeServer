// --- Node Inserts ---
import db from '../db.js';

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
    num: node.num,
    label: node.label ?? null,
    last_seen: node.last_seen ?? timestamp,
    viaMqtt: node.viaMqtt ? 1 : 0,
    hopsAway: node.hopsAway ?? null,
    lastHeard: node.lastHeard ?? null,
    device_id: node.device_id ?? null
  });
};

// insertNodeUsers ===========================================
export function insertNodeUsers(user, nodeNum) {
  db.prepare(`
    INSERT INTO node_users (
      nodeNum, userId, longName, shortName, macaddr,
      hwModel, publicKey, isUnmessagable, updatedAt
    ) VALUES (
      @nodeNum, @userId, @longName, @shortName, @macaddr,
      @hwModel, @publicKey, @isUnmessagable, @updatedAt
    )
    ON CONFLICT(nodeNum) DO UPDATE SET
      userId = excluded.userId,
      longName = excluded.longName,
      shortName = excluded.shortName,
      macaddr = excluded.macaddr,
      hwModel = excluded.hwModel,
      publicKey = excluded.publicKey,
      isUnmessagable = excluded.isUnmessagable,
      updatedAt = excluded.updatedAt
  `).run({
    nodeNum,
    userId: user.id,
    longName: user.longName ?? `Meshtastic Node ${nodeNum}`,
    shortName: user.shortName,
    macaddr: user.macaddr,
    hwModel: user.hwModel,
    publicKey: user.publicKey,
    isUnmessagable: user.isUnmessagable ? 1 : 0,
    updatedAt: Date.now()
  });
}

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

// UpsertNodeInfo ===========================================
export const upsertNodeInfo = (nodeInfo) => {
  const num = nodeInfo?.num;

  if (!num) {
    console.warn('[upsertNodeInfo] Skipping: nodeInfo.num is missing', nodeInfo);
    return null;
  }

  const tx = db.transaction(() => {
    insertNode({
      num,
      label: nodeInfo.user?.longName ?? null,
      last_seen: nodeInfo.lastHeard ?? Date.now(),
      viaMqtt: nodeInfo.viaMqtt,
      hopsAway: nodeInfo.hopsAway,
      lastHeard: nodeInfo.lastHeard
    });

    if (nodeInfo.user) {
      insertNodeUsers(nodeInfo.user, num);
    }

    if (nodeInfo.deviceMetrics) {
      insertNodeMetrics(nodeInfo.deviceMetrics, {
        num,
        lastHeard: nodeInfo.lastHeard
      });
    }
  });

  tx();
  return { num };
};

// insertUser ===========================================
export const insertUser = (user) => {
  const stmt = db.prepare(`
    INSERT INTO users (id, longName, shortName, macaddr, hwModel, publicKey, isUnmessagable, nodeNum)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      longName = excluded.longName,
      shortName = excluded.shortName,
      macaddr = excluded.macaddr,
      hwModel = excluded.hwModel,
      publicKey = excluded.publicKey,
      isUnmessagable = excluded.isUnmessagable,
      nodeNum = excluded.nodeNum
  `);

  stmt.run(
    user.id,
    user.longName,
    user.shortName,
    user.macaddr,
    user.hwModel,
    user.publicKey,
    user.isUnmessagable ? 1 : 0,
    user.nodeNum
  );
};

// insertPosition ===========================================
export function insertPosition(decoded) {
  const { fromNodeNum, toNodeNum, latitude, longitude, altitude, timestamp } = decoded;
  const ts = timestamp ?? Date.now();

  db.prepare(`
    INSERT INTO positions (fromNodeNum, toNodeNum, latitude, longitude, altitude, timestamp)
    VALUES (@fromNodeNum, @toNodeNum, @latitude, @longitude, @altitude, @ts)
  `).run({
    fromNodeNum,
    toNodeNum,
    latitude: Number(latitude),
    longitude: Number(longitude),
    altitude: altitude != null ? Number(altitude) : null,
    ts
  });
}
