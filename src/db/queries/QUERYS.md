## 📁 Proposed Query Modules in `src/db/queries`

| File                 | Query Logic                                                                 |
|----------------------|------------------------------------------------------------------------------|
| `nodesQuery.js`      | `listNodes`, `getNodeByNum`, `getChannelsForNode`, `getConnectionsForNode`, etc. |
| `packetsQuery.js`    | `listPacketLogs`, `getPacketLogById`, `getRecentPacketLogsForNode`           |
| `devicesQuery.js`    | `listDevices`, `getDeviceById`, `getDeviceSettings`, `getDeviceSettingByType` |
| `metricsQuery.js`    | `getTelemetryForNode`, `getEventsForNode`, `getGlobalVoltageStats`           |
| `diagnosticsQuery.js`| `getLogs`, `getFullConfig`                                                   |
