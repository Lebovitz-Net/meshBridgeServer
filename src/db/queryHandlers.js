// 🧩 Device Queries
export const listDevices = () => {
  return db.prepare(`SELECT * FROM devices ORDER BY last_seen DESC`).all();
};

export const getDeviceById = (device_id) => {
  return db.prepare(`SELECT * FROM devices WHERE device_id = ?`).get(device_id);
};

export const getDeviceSettings = (device_id) => {
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

export const getDeviceSettingByType = (device_id, config_type) => {
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

export const getChannelsForNode = (num) => {
  return db.prepare(`
    SELECT channel_id, name
    FROM channels
    WHERE num = ?
    ORDER BY name ASC
  `).all(num);
};

export const getMessagesForChannel = (channel_id, limit = 50) => {
  return db.prepare(`
    SELECT message_id, sender, content, timestamp
    FROM messages
    WHERE channel_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(channel_id, limit);
};

export const getConnectionsForNode = (num) => {
  return db.prepare(`
    SELECT connection_id, transport, status
    FROM connections
    WHERE num = ?
    ORDER BY connection_id ASC
  `).all(num);
};

export const getRecentPacketLogsForNode = (num, limit = 100) => {
  return db.prepare(`
    SELECT log_id, packet_type, timestamp, raw_payload
    FROM packet_logs
    WHERE num = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(num, limit);
};

export const getEventsForNode = (num, type = null) => {
  const stmt = type
    ? db.prepare(`
        SELECT event_id, event_type, details, timestamp
        FROM event_emissions
        WHERE num = ? AND event_type = ?
        ORDER BY timestamp DESC
      `)
    : db.prepare(`
        SELECT event_id, event_type, details, timestamp
        FROM event_emissions
        WHERE num = ?
        ORDER BY timestamp DESC
      `);

  return type ? stmt.all(num, type) : stmt.all(num);
};

export const getGlobalVoltageStats = () => {
  return db.prepare(`
    SELECT
      COUNT(*) AS count,
      AVG(voltage) AS avg_voltage,
      MIN(voltage) AS min_voltage,
      MAX(voltage) AS max_voltage
    FROM device_metrics
    WHERE voltage IS NOT NULL
  `).get();
};

export const getLogs = (limit = 200) => {
  return db.prepare(`
    SELECT log_id, num, packet_type, raw_payload, timestamp
    FROM packet_logs
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(limit);
};

export const getNodeByNum = (num) => {
  return db.prepare(`
    SELECT num, label, last_seen, viaMqtt, hopsAway, lastHeard
    FROM nodes
    WHERE num = ?
  `).get(num);
};

export const getPacketLogById = (id) => {
  return db.prepare(`
    SELECT log_id, num, packet_type, raw_payload, timestamp
    FROM packet_logs
    WHERE log_id = ?
  `).get(id);
};
export const getTelemetryForNode = (num) => {
  return db.prepare(`
    SELECT telemetry_id, metric, value, timestamp
    FROM telemetry
    WHERE num = ?
    ORDER BY timestamp DESC
  `).all(num);
};

export const listNodes = () => {
  return db.prepare(`
    SELECT num, label, last_seen, viaMqtt, hopsAway, lastHeard
    FROM nodes
    ORDER BY last_seen DESC
  `).all();
};

export const listPacketLogs = (limit = 100) => {
  return db.prepare(`
    SELECT log_id, num, packet_type, raw_payload, timestamp
    FROM packet_logs
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(limit);
};


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
