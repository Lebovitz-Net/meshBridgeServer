-- Creates device_metrics table
CREATE TABLE IF NOT EXISTS device_metrics (
  num INTEGER,
  timestamp INTEGER DEFAULT (strftime('%s','now')),
  batteryLevel INTEGER,
  voltage REAL,
  channelUtilization REAL,
  airUtilTx REAL,
  uptimeSeconds INTEGER,
  FOREIGN KEY (num) REFERENCES nodes(num)
);
