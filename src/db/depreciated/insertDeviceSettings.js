// src/bridge/db/insertDeviceSetting.js

import db from './dbschema.js';

export function insertDeviceSetting({ num, device_id, config_type, config_json, conn_id }) {
  if (!device_id || !config_type || !config_json) {
    console.warn('[insertDeviceSetting] Skipped insert: missing required fields', num, device_id, config_type, config_json);
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO device_settings (device_id, config_type, config_json, conn_id, updated_at)
    VALUES (?, ?, ?, ?, strftime('%s','now'))
    ON CONFLICT(device_id, config_type) DO UPDATE SET
    num         = excluded.num,
    config_json = excluded.config_json,
    conn_id     = excluded.conn_id,
    updated_at  = excluded.updated_at;

  `);

  stmt.run(device_id, config_type, config_json, conn_id);
}
