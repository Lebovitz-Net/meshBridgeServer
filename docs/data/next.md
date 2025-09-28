queueStatus in FromRadio.oneof
It’s a diagnostic packet that reports internal queue metrics—like transmit buffer fullness, dropped packets, or retry counts.

It’s not telemetry in the traditional sense (battery, voltage, etc.), but it is a metric subtype.

You can treat it as metric_type = 'queue_status' and insert it into your metrics table.

✅ Suggested ingest logic
In ingestionRouter.js:

```js
if (packet.type === 'queueStatus') {
  insertHandlers.insertMetric({
    metric_type: 'queue_status',
    node_num: meta.fromNodeNum,
    device_id: meta.device_id,
    tx_fullness: data.txFullness,
    rx_fullness: data.rxFullness,
    dropped_packets: data.droppedPackets,
    retry_count: data.retryCount,
    timestamp: Date.now(),
    conn_id: meta.connId
  });
}
```

Make sure your schema supports these fields, or adapt based on the actual protobuf definition.

🧱 Contributor clarity
Update SCHEMA.md or decodeMetricTypes.md:

“queueStatus is a FromRadio oneof subtype used for internal diagnostics. It is decoded and inserted into the metrics table with metric_type = 'queue_status'. This includes fields like transmit fullness, dropped packets, and retry counts.”

Want help scaffolding the decodeQueueStatus() helper or patching the insert handler with dry-run safety and contributor annotations? I can generate that with full onboarding clarity.

Contributor clarity
Update SCHEMA.md or decodeMetricTypes.md:

“queueStatus is a FromRadio oneof subtype used for internal diagnostics. It is decoded and inserted into the metrics table with metric_type = 'queue_status'. This includes fields like transmit fullness, dropped packets, and retry counts.”

Want help scaffolding the decodeQueueStatus() helper or patching the insert handler with dry-run safety and contributor annotations? I can generate that with full onboarding clarity.

so I added all the oneofs for FromRadio and we are not handling a bunch of them. In particular, Config, and ModuleConfig. Need to debug logRecords, and FileInfo causes issues.
That’s a solid sweep, Gregg—and it sounds like you’re at the edge of full protocol coverage. Let’s break down the missing FromRadio oneofs and sketch out how to scaffold handlers or debug flows for each:

🧩 Unhandled FromRadio oneofs
1. Config
Purpose: Contains the full node configuration (radio settings, UI preferences, etc.)

Action: Decode and insert into a config_snapshots table or emit to UI for live inspection.

Suggested handler:

```js
if (packet.type === 'config') {
  insertHandlers.insertConfigSnapshot({
    node_num: meta.fromNodeNum,
    device_id: meta.device_id,
    config_json: JSON.stringify(data),
    timestamp: Date.now(),
    conn_id: meta.connId
 });
}
```

2. ModuleConfig
Purpose: Contains config for specific modules (e.g. position, telemetry, store-and-forward)

Action: Decode and store per-module settings, possibly in module_configs table.

Suggested handler:

```js
if (packet.type === 'moduleConfig') {
  insertHandlers.insertModuleConfig({
    node_num: meta.fromNodeNum,
    module_name: data.moduleName,
    config_json: JSON.stringify(data),
    timestamp: Date.now(),
    conn_id: meta.connId
  });
}
```
🐞 Debugging logRecord
Purpose: Captures internal logs from the node (e.g. boot messages, errors)

Issue: May contain binary or malformed strings depending on firmware version

Action: Log to console first, then scaffold a log_records table if useful

```js
if (packet.type === 'logRecord') {
  console.log(`[LogRecord] ${data.text}`);
  // Optionally insert:
  insertHandlers.insertLogRecord({
    node_num: meta.fromNodeNum,
    device_id: meta.device_id,
    log_text: data.text,
    timestamp: Date.now(),
    conn_id: meta.connId
  });
}
```

⚠️ FileInfo causing issues?
Purpose: Used during file transfer (e.g. firmware updates, image sharing)

Common issues:

Large payloads or missing fields

Unexpected binary blobs

Misclassified packet types

Debug strategy:

Log raw data and meta to console

Validate protobuf decoding

Patch packetDecoder.js to catch malformed FileInfo packets and annotate fallback behavior

```js
if (packet.type === 'fileInfo') {
  console.warn('[FileInfo] Received file metadata:', data);
  // Optionally skip or insert depending on stability
}
```

🧱 Contributor clarity
Update ARCHITECTURE.md:

“The FromRadio oneof group includes diagnostic and config packets like config, moduleConfig, logRecord, and fileInfo. These are decoded and routed to specialized insert handlers or logged for debugging. Malformed or unsupported packets are annotated and skipped to preserve ingest stability.”

Want help scaffolding the missing insert handlers, patching the decoder with fallback logic, or annotating the ingest router for full oneof coverage? I can generate that with dry-run safety and onboarding clarity.

## need to handle missing handling of metadata

```js
[decodeFromRadioPacket] Unknown FromRadio subtype: metadata {
  type: 'metadata',
  data: {
    firmwareVersion: '2.6.11.60ec05e',
    deviceStateVersion: 24,
    canShutdown: true,
    hasWifi: true,
    hasBluetooth: true,
    hwModel: 43,
    hasPKC: true,
    excludedModules: 1280
  },
  connId: 'mesh-1',
  timestamp: 1759022685303,
  fromNodeNum: 3758940216,
  toNodeNum: null,
  device_id: '192.168.1.52'
}
```