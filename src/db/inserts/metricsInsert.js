// --- Metric Inserts ---
import db from '../dbschema.js';

export const insertTelemetry = (telemetry) => {
  const stmt = db.prepare(`
    INSERT INTO telemetry (num, metric, value, timestamp)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(telemetry.num, telemetry.metric, telemetry.value, telemetry.timestamp);
};

export const insertEventEmission = (event) => {
  const stmt = db.prepare(`
    INSERT INTO event_emissions (num, event_type, details, timestamp)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(event.num, event.event_type, event.details, event.timestamp);
};

export const insertQueueStatus = (status) => {
  const stmt = db.prepare(`
    INSERT INTO queue_status (num, status, timestamp)
    VALUES (?, ?, ?)
  `);
  stmt.run(status.num, status.status, status.timestamp);
};

export const insertDeviceMetrics = (metrics) => {
  const stmt = db.prepare(`
    INSERT INTO device_metrics (device_id, voltage, temperature, timestamp)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(metrics.device_id, metrics.voltage, metrics.temperature, metrics.timestamp);
};

export const insertEnvironmentMetrics = (metrics) => {
  const stmt = db.prepare(`
    INSERT INTO environment_metrics (num, humidity, temperature, timestamp)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(metrics.num, metrics.humidity, metrics.temperature, metrics.timestamp);
};

export const insertAirQualityMetrics = (metrics) => {
  const stmt = db.prepare(`
    INSERT INTO air_quality_metrics (num, pm25, pm10, timestamp)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(metrics.num, metrics.pm25, metrics.pm10, metrics.timestamp);
};

export const insertPowerMetrics = (metrics) => {
  const stmt = db.prepare(`
    INSERT INTO power_metrics (num, voltage, current, timestamp)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(metrics.num, metrics.voltage, metrics.current, metrics.timestamp);
};

export const insertLocalStats = (stats) => {
  const stmt = db.prepare(`
    INSERT INTO local_stats (num, stat_type, value, timestamp)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(stats.num, stats.stat_type, stats.value, stats.timestamp);
};

export const insertHealthMetrics = (metrics) => {
  const stmt = db.prepare(`
    INSERT INTO health_metrics (num, cpu_usage, memory_usage, timestamp)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(metrics.num, metrics.cpu_usage, metrics.memory_usage, metrics.timestamp);
};

export const insertHostMetrics = (metrics) => {
  const stmt = db.prepare(`
    INSERT INTO host_metrics (host_id, cpu_load, disk_usage, timestamp)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(metrics.host_id, metrics.cpu_load, metrics.disk_usage, metrics.timestamp);
};
