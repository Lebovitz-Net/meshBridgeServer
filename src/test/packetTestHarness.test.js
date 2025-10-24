// metricsTestHarness.js
import db from '../dbschema.js';
import {
  insertTelemetry,
  insertEventEmission,
  insertQueueStatus,
  insertDeviceMetrics,
  insertEnvironmentMetrics,
  insertAirQualityMetrics,
  insertPowerMetrics,
  insertLocalStats,
  insertHealthMetrics,
  insertHostMetrics,
  insertMetricsHandler
} from './metricInserts.js';

// Utility: simple query helper
function dumpTable(table) {
  const rows = db.prepare(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 3`).all();
  console.log(`\n=== ${table} ===`);
  console.table(rows);
}

// Synthetic telemetry packet with all groups
const sampleTelemetry = {
  fromNodeNum: 101,
  toNodeNum: 202,
  time: Math.floor(Date.now() / 1000),

  deviceMetrics: {
    batteryLevel: 95,
    txPower: 10,
    uptime: 123456,
    cpuTemp: 42.5,
    memoryUsage: 0.65
  },

  environmentMetrics: {
    temperature: 22.3,
    humidity: 55.1,
    pressure: 1013.2,
    lightLevel: 300
  },

  airQualityMetrics: {
    pm25: 12.5,
    pm10: 20.1,
    co2: 415,
    voc: 0.02,
    ozone: 0.01
  },

  powerMetrics: {
    voltage: 3.7,
    current: 0.5,
    power: 1.85,
    energy: 12.3,
    frequency: 60
  },

  localStats: {
    snr: 9.5,
    rssi: -70,
    hopCount: 2,
    linkQuality: 0.9,
    packetLoss: 0.05
  },

  healthMetrics: {
    cpuTemp: 45.2,
    diskUsage: 0.7,
    memoryUsage: 0.6,
    uptime: 654321,
    loadAvg: 0.3
  },

  hostMetrics: {
    hostname: 'mesh-node-101',
    uptime: 654321,
    loadAvg: 0.25,
    osVersion: 'meshOS-1.0',
    bootTime: Date.now() - 654321000
  }
};

// Run test
console.log('Inserting sample telemetry...');
insertMetricsHandler(sampleTelemetry);

// Also test telemetry/event/queue inserts
insertTelemetry({
  fromNodeNum: 101,
  toNodeNum: 202,
  metric: 'signalStrength',
  value: -65,
  timestamp: Date.now()
});

insertEventEmission({
  num: 101,
  event_type: 'nodeJoined',
  details: 'Node 101 joined mesh',
  timestamp: Date.now()
});

insertQueueStatus({
  num: 101,
  res: 10,
  free: 5,
  maxlen: 20,
  mesh_packet_id: 999,
  timestamp: Date.now(),
  conn_id: 'conn-1'
});

// Dump results
[
  'telemetry',
  'event_emissions',
  'queue_status',
  'device_metrics',
  'environment_metrics',
  'air_quality_metrics',
  'power_metrics',
  'local_stats',
  'health_metrics',
  'host_metrics'
].forEach(dumpTable);

console.log('\n✅ Metrics test harness complete.');
