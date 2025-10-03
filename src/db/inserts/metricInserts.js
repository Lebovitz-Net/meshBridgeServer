// --- Metric Inserts ---
import db from '../dbschema.js';

// Telemetry ==========================================================
export const insertTelemetry = (tel) => {
  db.prepare(`
    INSERT INTO telemetry (fromNodeNum, toNodeNum, metric, value, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(tel.fromNodeNum, tel.toNodeNum, tel.metric, tel.value, tel.timestamp || Date.now());
};

// Event Emissions ====================================================
export const insertEventEmission = (event) => {
  db.prepare(`
    INSERT INTO event_emissions (num, event_type, details, timestamp)
    VALUES (?, ?, ?, ?)
  `).run(event.num, event.event_type, event.details, event.timestamp);
};

// Queue Status =======================================================
export const insertQueueStatus = (qs) => {
  db.prepare(`
    INSERT INTO queue_status (
      num, res, free, maxlen, mesh_packet_id, timestamp, conn_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(qs.num, qs.res, qs.free, qs.maxlen, qs.mesh_packet_id || null, qs.timestamp || Date.now(), qs.conn_id || null);
};

// Device Metrics =====================================================
export function insertDeviceMetrics({
  fromNodeNum, toNodeNum, batteryLevel, txPower, uptime, cpuTemp, memoryUsage, timestamp
}) {
  db.prepare(`
    INSERT INTO device_metrics (
      fromNodeNum, toNodeNum, batteryLevel, txPower, uptime, cpuTemp, memoryUsage, timestamp
    ) VALUES (
      @fromNodeNum, @toNodeNum, @batteryLevel, @txPower, @uptime, @cpuTemp, @memoryUsage, @timestamp
    )
  `).run({ fromNodeNum, toNodeNum, batteryLevel, txPower, uptime, cpuTemp, memoryUsage, timestamp });
}

// Environment Metrics ================================================
export function insertEnvironmentMetrics({
  fromNodeNum, toNodeNum, temperature, humidity, pressure, lightLevel, timestamp
}) {
  db.prepare(`
    INSERT INTO environment_metrics (
      fromNodeNum, toNodeNum, temperature, humidity, pressure, lightLevel, timestamp
    ) VALUES (
      @fromNodeNum, @toNodeNum, @temperature, @humidity, @pressure, @lightLevel, @timestamp
    )
  `).run({ fromNodeNum, toNodeNum, temperature, humidity, pressure, lightLevel, timestamp });
}

// Air Quality Metrics ================================================
export function insertAirQualityMetrics({
  fromNodeNum, toNodeNum, pm25, pm10, co2, voc, ozone, timestamp
}) {
  db.prepare(`
    INSERT INTO air_quality_metrics (
      fromNodeNum, toNodeNum, pm25, pm10, co2, voc, ozone, timestamp
    ) VALUES (
      @fromNodeNum, @toNodeNum, @pm25, @pm10, @co2, @voc, @ozone, @timestamp
    )
  `).run({ fromNodeNum, toNodeNum, pm25, pm10, co2, voc, ozone, timestamp });
}

// Power Metrics ======================================================
export function insertPowerMetrics({
  fromNodeNum, toNodeNum, voltage, current, power, energy, frequency, timestamp
}) {
  db.prepare(`
    INSERT INTO power_metrics (
      fromNodeNum, toNodeNum, voltage, current, power, energy, frequency, timestamp
    ) VALUES (
      @fromNodeNum, @toNodeNum, @voltage, @current, @power, @energy, @frequency, @timestamp
    )
  `).run({ fromNodeNum, toNodeNum, voltage, current, power, energy, frequency, timestamp });
}

// Local Stats ========================================================
export function insertLocalStats({
  fromNodeNum, toNodeNum, snr, rssi, hopCount, linkQuality, packetLoss, timestamp
}) {
  db.prepare(`
    INSERT INTO local_stats (
      fromNodeNum, toNodeNum, snr, rssi, hopCount, linkQuality, packetLoss, timestamp
    ) VALUES (
      @fromNodeNum, @toNodeNum, @snr, @rssi, @hopCount, @linkQuality, @packetLoss, @timestamp
    )
  `).run({ fromNodeNum, toNodeNum, snr, rssi, hopCount, linkQuality, packetLoss, timestamp });
}

// Health Metrics =====================================================
export function insertHealthMetrics({
  fromNodeNum, toNodeNum, cpuTemp, diskUsage, memoryUsage, uptime, loadAvg, timestamp
}) {
  db.prepare(`
    INSERT INTO health_metrics (
      fromNodeNum, toNodeNum, cpuTemp, diskUsage, memoryUsage, uptime, loadAvg, timestamp
    ) VALUES (
      @fromNodeNum, @toNodeNum, @cpuTemp, @diskUsage, @memoryUsage, @uptime, @loadAvg, @timestamp
    )
  `).run({ fromNodeNum, toNodeNum, cpuTemp, diskUsage, memoryUsage, uptime, loadAvg, timestamp });
}

// Host Metrics =======================================================
export function insertHostMetrics({
  fromNodeNum, toNodeNum, hostname, uptime, loadAvg, osVersion, bootTime, timestamp
}) {
  db.prepare(`
    INSERT INTO host_metrics (
      fromNodeNum, toNodeNum, hostname, uptime, loadAvg, osVersion, bootTime, timestamp
    ) VALUES (
      @fromNodeNum, @toNodeNum, @hostname, @uptime, @loadAvg, @osVersion, @bootTime, @timestamp
    )
  `).run({ fromNodeNum, toNodeNum, hostname, uptime, loadAvg, osVersion, bootTime, timestamp });
}

// Metrics Handler ====================================================
export function insertMetricsHandler(telemetry) {
  const { fromNodeNum, toNodeNum, time, ...metricGroups } = telemetry;
  const timestamp = time ? time * 1000 : Date.now();

  const knownMetricGroups = {
    deviceMetrics: insertDeviceMetrics,
    environmentMetrics: insertEnvironmentMetrics,
    airQualityMetrics: insertAirQualityMetrics,
    powerMetrics: insertPowerMetrics,
    localStats: insertLocalStats,
    healthMetrics: insertHealthMetrics,
    hostMetrics: insertHostMetrics
  };

  for (const [groupName, insertFn] of Object.entries(knownMetricGroups)) {
    const metrics = metricGroups[groupName];
    if (metrics) {
      try {
        insertFn({ fromNodeNum, toNodeNum, timestamp, ...metrics });
      } catch (err) {
        console.warn(`[insertMetricsHandler] Failed to insert ${groupName}:`, err);
      }
    }
  }
}
