// --- Device Inserts ---
import db from '../dbschema.js';

// Insert Device ==============================================================
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

// Insert Device Setting ======================================================
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

// Insert Device Meta =========================================================
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

// Upsert Device IP Map =======================================================
export function upsertDeviceIpMap({ source_ip, num, device_id, last_seen }) {
  return db.prepare(`
    INSERT INTO device_ip_map (source_ip, num, device_id, last_seen)
    VALUES (@source_ip, @num, @device_id, @last_seen)
    ON CONFLICT(source_ip) DO UPDATE SET
      num = excluded.num,
      device_id = excluded.device_id,
      last_seen = excluded.last_seen
  `).run({ source_ip, num, device_id, last_seen });
}

// Lookup Device IP Map =======================================================
export async function lookupDeviceIpMap(source_ip) {
  const row = await db.prepare(`
    SELECT num, device_id
    FROM device_ip_map
    WHERE source_ip = $source_ip
  `).get({ source_ip });
  return row || null;
}
