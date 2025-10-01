import db from '../dbschema.js';

export const getFullConfig = () => {
  return {
    protocolMap: db.prepare(`SELECT * FROM protocol_map ORDER BY portnum`).all(),
    deviceSettings: db.prepare(`SELECT * FROM device_settings ORDER BY num`).all(),
    deviceMeta: db.prepare(`SELECT * FROM device_meta ORDER BY num`).all(),
    overlays: db.prepare(`SELECT * FROM diagnostic_overlay ORDER BY overlay_id`).all(),
    queueStatus: db.prepare(`
      SELECT qs.* FROM queue_status qs
      JOIN (
        SELECT num, MAX(timestamp) AS latest
        FROM queue_status
        GROUP BY num
      ) latest_qs ON qs.num = latest_qs.num AND qs.timestamp = latest_qs.latest
      ORDER BY qs.num
    `).all()
  };
};

export const getConfig = (config_id) => {
  return db.prepare(`
    SELECT config_id, config_json, updated_at
    FROM config
    WHERE config_id = ?
  `).get(config_id);
};

export const listAllConfigs = () => {
  return db.prepare(`
    SELECT config_id, config_json, updated_at
    FROM config
    ORDER BY updated_at DESC
  `).all();
};

export const getModuleConfig = (module_id) => {
  return db.prepare(`
    SELECT module_id, config_json, updated_at
    FROM module_config
    WHERE module_id = ?
  `).get(module_id);
};

export const listAllModuleConfigs = () => {
  return db.prepare(`
    SELECT module_id, config_json, updated_at
    FROM module_config
    ORDER BY updated_at DESC
  `).all();
};

export const getMetadataByKey = (key) => {
  return db.prepare(`
    SELECT meta_id, key, value, updated_at
    FROM metadata
    WHERE key = ?
  `).get(key);
};

export const listAllMetadata = () => {
  return db.prepare(`
    SELECT meta_id, key, value, updated_at
    FROM metadata
    ORDER BY updated_at DESC
  `).all();
};

export const listFileInfo = () => {
  return db.prepare(`
    SELECT file_id, filename, size, uploaded_at
    FROM file_info
    ORDER BY uploaded_at DESC
  `).all();
};
