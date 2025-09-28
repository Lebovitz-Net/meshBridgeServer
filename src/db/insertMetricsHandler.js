import insertMetrics from './insertMetrics.js';

const knownMetricGroups = {
  deviceMetrics: insertMetrics.insertDeviceMetrics,
  environmentMetrics: insertMetrics.insertEnvironmentMetrics,
  airQualityMetrics: insertMetrics.insertAirQualityMetrics,
  powerMetrics: insertMetrics.insertPowerMetrics,
  localStats: insertMetrics.insertLocalStats,
  healthMetrics: insertMetrics.insertHealthMetrics,
  hostMetrics: insertMetrics.insertHostMetrics
};

/**
 * Accepts a structured telemetry object and inserts present metric groups.
 *
 * @param {Object} telemetry - Parsed telemetry object with lineage and metric groups
 */
export function insertMetricsHandler(telemetry) {
  const { fromNodeNum, toNodeNum, time, ...metricGroups } = telemetry;
  const timestamp = time * 1000;

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
