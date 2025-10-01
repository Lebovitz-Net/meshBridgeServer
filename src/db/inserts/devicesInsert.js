// --- Device Inserts ---
import db from '../dbschema.js';

export const insertDevice = (device) => {
  const stmt = db.prepare(`
    INSERT INTO devices (device_id, label, last_seen)
    VALUES (?, ?, ?)
  `);
  stmt.run(device.device_id, device.label, device.last_seen);
};

export const insertDeviceSetting = (setting) => {
  const stmt = db.prepare(`
    INSERT INTO device_settings (device_id, config_type, config_json, updated_at, conn_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(setting.device_id, setting.config_type, setting.config_json, setting.updated_at, setting.conn_id);
};

export const insertDeviceMeta = (meta) => {
  const stmt = db.prepare(`
    INSERT INTO device_meta (device_id, firmware, hardware, region)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(meta.device_id, meta.firmware, meta.hardware, meta.region);
};

export const upsertDeviceIpMap = (device_id, ip) => {
  const stmt = db.prepare(`
    INSERT INTO device_ip_map (device_id, ip)
    VALUES (?, ?)
    ON CONFLICT(device_id) DO UPDATE SET ip = excluded.ip
  `);
  stmt.run(device_id, ip);
};

export const lookupDeviceIpMap = (device_id) => {
  const stmt = db.prepare(`
    SELECT ip FROM device_ip_map WHERE device_id = ?
  `);
  const row = stmt.get(device_id);
  return row?.ip || null;
};
