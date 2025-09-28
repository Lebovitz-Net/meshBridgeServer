import db from '../db/dbschema.js';

export function insertDeviceMetrics({
  fromNodeNum, toNodeNum, batteryLevel, txPower, uptime, cpuTemp, memoryUsage, timestamp
}) {
  db.prepare(`
    INSERT INTO device_metrics (
      fromNodeNum, toNodeNum, batteryLevel, txPower, uptime, cpuTemp, memoryUsage, timestamp
    ) VALUES (
      @fromNodeNum, @toNodeNum, @batteryLevel, @txPower, @uptime, @cpuTemp, @memoryUsage, @timestamp
    )
  `).run({
    fromNodeNum,
    toNodeNum,
    batteryLevel,
    txPower,
    uptime,
    cpuTemp,
    memoryUsage,
    timestamp
  });
}

export function insertEnvironmentMetrics({
  fromNodeNum, toNodeNum, temperature, humidity, pressure, lightLevel, timestamp
}) {
  db.prepare(`
    INSERT INTO environment_metrics (
      fromNodeNum, toNodeNum, temperature, humidity, pressure, lightLevel, timestamp
    ) VALUES (
      @fromNodeNum, @toNodeNum, @temperature, @humidity, @pressure, @lightLevel, @timestamp
    )
  `).run({
    fromNodeNum,
    toNodeNum,
    temperature,
    humidity,
    pressure,
    lightLevel,
    timestamp
  });
}

export function insertAirQualityMetrics({
  fromNodeNum, toNodeNum, pm25, pm10, co2, voc, ozone, timestamp
}) {
  db.prepare(`
    INSERT INTO air_quality_metrics (
      fromNodeNum, toNodeNum, pm25, pm10, co2, voc, ozone, timestamp
    ) VALUES (
      @fromNodeNum, @toNodeNum, @pm25, @pm10, @co2, @voc, @ozone, @timestamp
    )
  `).run({
    fromNodeNum,
    toNodeNum,
    pm25,
    pm10,
    co2,
    voc,
    ozone,
    timestamp
  });
}

export function insertPowerMetrics({
  fromNodeNum, toNodeNum, voltage, current, power, energy, frequency, timestamp
}) {
  db.prepare(`
    INSERT INTO power_metrics (
      fromNodeNum, toNodeNum, voltage, current, power, energy, frequency, timestamp
    ) VALUES (
      @fromNodeNum, @toNodeNum, @voltage, @current, @power, @energy, @frequency, @timestamp
    )
  `).run({
    fromNodeNum,
    toNodeNum,
    voltage,
    current,
    power,
    energy,
    frequency,
    timestamp
  });
}

export function insertLocalStats({
  fromNodeNum, toNodeNum, snr, rssi, hopCount, linkQuality, packetLoss, timestamp
}) {
  db.prepare(`
    INSERT INTO local_stats (
      fromNodeNum, toNodeNum, snr, rssi, hopCount, linkQuality, packetLoss, timestamp
    ) VALUES (
      @fromNodeNum, @toNodeNum, @snr, @rssi, @hopCount, @linkQuality, @packetLoss, @timestamp
    )
  `).run({
    fromNodeNum,
    toNodeNum,
    snr,
    rssi,
    hopCount,
    linkQuality,
    packetLoss,
    timestamp
  });
}

export function insertHealthMetrics({
  fromNodeNum, toNodeNum, cpuTemp, diskUsage, memoryUsage, uptime, loadAvg, timestamp
}) {
  db.prepare(`
    INSERT INTO health_metrics (
      fromNodeNum, toNodeNum, cpuTemp, diskUsage, memoryUsage, uptime, loadAvg, timestamp
    ) VALUES (
      @fromNodeNum, @toNodeNum, @cpuTemp, @diskUsage, @memoryUsage, @uptime, @loadAvg, @timestamp
    )
  `).run({
    fromNodeNum,
    toNodeNum,
    cpuTemp,
    diskUsage,
    memoryUsage,
    uptime,
    loadAvg,
    timestamp
  });
}

export function insertHostMetrics({
  fromNodeNum, toNodeNum, hostname, uptime, loadAvg, osVersion, bootTime, timestamp
}) {
  db.prepare(`
    INSERT INTO host_metrics (
      fromNodeNum, toNodeNum, hostname, uptime, loadAvg, osVersion, bootTime, timestamp
    ) VALUES (
      @fromNodeNum, @toNodeNum, @hostname, @uptime, @loadAvg, @osVersion, @bootTime, @timestamp
    )
  `).run({
    fromNodeNum,
    toNodeNum,
    hostname,
    uptime,
    loadAvg,
    osVersion,
    bootTime,
    timestamp
  });
}

export default {
  insertDeviceMetrics,
  insertEnvironmentMetrics,
  insertAirQualityMetrics,
  insertPowerMetrics,
  insertLocalStats,
  insertHealthMetrics,
  insertHostMetrics
};
