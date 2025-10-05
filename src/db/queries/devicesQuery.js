import db from '../db.js';

// --- devicesQuery.js ---
export const placeholderQuery = () => 'Query handler ready';
// --- Device Queries ---
export const listDevices = () => {
  return db.prepare(`SELECT * FROM devices ORDER BY last_seen DESC`).all();
};

export const getDevice = (device_id) => {
  return db.prepare(`SELECT * FROM devices WHERE device_id = ?`).get(device_id);
};

export const listDeviceSettings = (device_id) => {
  const rows = db.prepare(`
    SELECT config_type, config_json, updated_at, conn_id
    FROM device_settings
    WHERE device_id = ?
    ORDER BY config_type ASC
  `).all(device_id);

  const settings = {};
  for (const row of rows) {
    try {
      settings[row.config_type] = JSON.parse(row.config_json);
    } catch {
      settings[row.config_type] = null;
    }
  }
  return settings;
};

export const getDeviceSetting = (device_id, config_type) => {
  const row = db.prepare(`
    SELECT config_type, config_json, updated_at, conn_id
    FROM device_settings
    WHERE device_id = ? AND config_type = ?
  `).get(device_id, config_type);

  if (!row) return null;

  try {
    return {
      config_type: row.config_type,
      config_json: JSON.parse(row.config_json),
      updated_at: row.updated_at,
      conn_id: row.conn_id
    };
  } catch {
    return {
      config_type: row.config_type,
      config_json: null,
      updated_at: row.updated_at,
      conn_id: row.conn_id
    };
  }
};
