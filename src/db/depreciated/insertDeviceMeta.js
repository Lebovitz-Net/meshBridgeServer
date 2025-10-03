// src/bridge/db/insertDeviceMeta.js

import db from './dbschema.js';

export function insertDeviceMeta({
  device_id,
  reboot_count,
  min_app_version,
  pio_env,
  firmware_version,
  hw_model,
  conn_id
}) {
  if (!device_id) {
    console.warn('[insertDeviceMeta] Skipped insert: missing device_id');
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO device_meta (
      device_id, reboot_count, min_app_version, pio_env,
      firmware_version, hw_model, conn_id, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s','now'))
  `);

  stmt.run(
    device_id,
    reboot_count,
    min_app_version,
    pio_env,
    firmware_version,
    hw_model,
    conn_id
  );
}
