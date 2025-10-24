// --- Node Inserts ---
import db from '../db.js';
import { emitNodeUpdate } from '../../utils/sseEmitters.js';


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
  const longName = Buffer.isBuffer(user.longName) ? Buffer.toString(user.longName) : user.longName;
  const shortName = Buffer.isBuffer(user.shortName) ? Buffer.toString(user.shortname) : user.shortName;
  const macaddr = Buffer.isBuffer(user.macaddr) ? Buffer.toString(user.macaddr) : user.macaddr;

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
    userId: user?.id ?? null,
    longName: longName ?? `Meshtastic Node ${nodeNum}`,
    shortName: shortName ?? null,
    macaddr: macaddr ?? null,
    hwModel: user?.hwModel ?? null,
    publicKey: user?.publicKey ?? null,
    isUnmessagable: user?.isUnmessagable ? 1 : 0,
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

// UpsertNodeInfo ===========================================
export const upsertNodeInfo = (nodeInfo) => {
  const num = nodeInfo?.num;

  if (!num) {
    console.warn('[upsertNodeInfo] Skipping: nodeInfo.num is missing', nodeInfo);
    return null;
  }

  const tx = db.transaction(() => {
    const user = nodeInfo.user ? nodeInfo.user : nodeInfo;
    insertNode({
      num,
      label: user?.longName ??  null,
      last_seen: nodeInfo.lastHeard ?? Date.now(),
      viaMqtt: nodeInfo.viaMqtt,
      hopsAway: nodeInfo.hopsAway,
      lastHeard: nodeInfo.lastHeard ?? null
    });

    if (user.id) {
      insertNodeUsers(user, num);
    } else {
      // console.log('No user info to insert for node', nodeInfo, num);
    }

    if (nodeInfo.deviceMetrics != null) {
      insertNodeMetrics(nodeInfo, {
        num,
        lastHeard: nodeInfo.lastHeard
      });
    }

    if (nodeInfo.postion) {
       const data = node.position;
       console.log('.../nodesInsert upsertNodes position');
       insertPosition({
        fromNodeNum: num,
        toNodeNum: 0xffffffff,
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: data.altitude || null,
        sats_in_view: data.satsInView || null,
        batteryLevel: data.batteryLevel || null,
        device_id: nodeInfo.device_d,
        conn_id: nodeInfo.connId,
        timestamp: nodeInfo.timestamp,
       })
    }
  });

  tx();

  // 🔥 Emit SSE update after successful insert/update
  emitNodeUpdate({
    num,
    label: nodeInfo.user?.longName ?? nodeInfo.longName ?? null,
    longName: nodeInfo.user?.longName ?? nodeInfo.longName ??  null,
    shortName: nodeInfo.user?.shortName ?? nodeInfo.shortname ?? null,
    lastheard: nodeInfo.lastHeard ?? Date.now(),
    viaMqtt: nodeInfo.viaMqtt,
    hopsAway: nodeInfo.hopsAway,
    lastHeard: nodeInfo.lastHeard,
    device_id: nodeInfo.device_id ?? null
  });

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
