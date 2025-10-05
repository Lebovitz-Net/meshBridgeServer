import db from '../db.js';

export const listTelemetryForNode = (num) => {
  return db.prepare(`
    SELECT telemetry_id, metric, value, timestamp
    FROM telemetry
    WHERE num = ?
    ORDER BY timestamp DESC
  `).all(num);
};

export const listEventsForNode = (num, type = null) => {
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

export const getVoltageStats = () => {
  return db.prepare(`
    SELECT
      COUNT(*) AS count,
      AVG(voltage) AS avg_voltage,
      MIN(voltage) AS min_voltage,
      MAX(voltage AS max_voltage
    FROM device_metrics
    WHERE voltage IS NOT NULL
  `).get();
};
