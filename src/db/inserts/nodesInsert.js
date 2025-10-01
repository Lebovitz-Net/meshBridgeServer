// --- Node Inserts ---
import db from '../dbschema.js';

export const insertNode = (node) => {
  const stmt = db.prepare(`
    INSERT INTO nodes (num, label, last_seen, viaMqtt, hopsAway, lastHeard)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(node.num, node.label, node.last_seen, node.viaMqtt, node.hopsAway, node.lastHeard);
};

export const insertNodeUsers = (nodeUsers) => {
  const stmt = db.prepare(`
    INSERT INTO node_users (num, user_id, role)
    VALUES (?, ?, ?)
  `);
  for (const user of nodeUsers) {
    stmt.run(user.num, user.user_id, user.role);
  }
};

export const insertNodeMetrics = (metrics) => {
  const stmt = db.prepare(`
    INSERT INTO node_metrics (num, metric, value, timestamp)
    VALUES (?, ?, ?, ?)
  `);
  for (const m of metrics) {
    stmt.run(m.num, m.metric, m.value, m.timestamp);
  }
};

export const upsertNodeInfo = (info) => {
  const stmt = db.prepare(`
    INSERT INTO node_info (num, label, last_seen)
    VALUES (?, ?, ?)
    ON CONFLICT(num) DO UPDATE SET
      label = excluded.label,
      last_seen = excluded.last_seen
  `);
  stmt.run(info.num, info.label, info.last_seen);
};

export const deleteNode = (num) => {
  const stmt = db.prepare(`DELETE FROM nodes WHERE num = ?`);
  stmt.run(num);
};

export const insertUser = (user) => {
  const stmt = db.prepare(`
    INSERT INTO users (user_id, name, role, joined_at)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(user.user_id, user.name, user.role, user.joined_at);
};

export const insertPosition = (position) => {
  const stmt = db.prepare(`
    INSERT INTO positions (position_id, num, lat, lon, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(position.position_id, position.num, position.lat, position.lon, position.timestamp);
};
