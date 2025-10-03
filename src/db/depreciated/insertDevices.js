import db from './dbschema.js';

export function insertDevice({ device_id, num, conn_id, device_type = 'meshtastic' }) {
  if (!device_id) {
    console.warn('[insertDevice] Skipped insert: missing device_id');
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO devices (device_id, num, conn_id, device_type, last_seen)
    VALUES (?, ?, ?, ?, strftime('%s','now'))
    ON CONFLICT(device_id) DO UPDATE SET
      num = excluded.num,
      conn_id = excluded.conn_id,
      device_type = excluded.device_type,
      last_seen = strftime('%s','now')
  `);

  stmt.run(device_id, num, conn_id, device_type);
}
