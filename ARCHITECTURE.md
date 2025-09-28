# MeshManager Architecture

MeshManager is a modular ingestion and observability backend for mesh networks. It is designed to support multiple protocols (e.g. Meshtastic, AREDN) and prioritize onboarding clarity, dry-run safety, and future extensibility.

---

## 🧭 Ingestion Flow

Packets arrive decoded and are routed via `routePacket(input, meta)`:

- Extracts fragments: `myInfo`, `metadata`, `config`, `moduleConfig`, `nodeInfo`
- Dispatches each fragment to its corresponding insert handler
- Logs skipped inserts with reasons (e.g. missing `device_id`)
- Broadcasts packet frame via WebSocket

### Routing Logic

| Fragment        | Handler                     | Table               |
|-----------------|-----------------------------|---------------------|
| `myInfo`        | `insertDevice`, `insertDeviceMeta` | `devices`, `device_meta` |
| `metadata`      | `insertDeviceMeta`          | `device_meta`       |
| `config.*`      | `insertDeviceSetting`       | `device_settings`   |
| `moduleConfig.*`| `insertDeviceSetting`       | `device_settings`   |
| `nodeInfo`      | `upsertNodeInfo`            | `nodes`, `users`    |
| `MeshPacket`    | `routeMeshDecoded`          | varies              |
| `telemetry`     | `insertTelemetry`           | `telemetry`         |
| `event`         | `insertEventEmission`       | `event_emissions`   |
| `connection`    | `insertConnection`          | `connections`       |
| `channelInfo`   | `insertChannel`             | `channels`          |
| all packets     | `insertPacketLog`           | `packet_logs`       |

---

## 🧱 Database Schema

MeshManager uses a relational schema with modular insert handlers. All inserts are dry-run safe and use `INSERT OR REPLACE` or `ON CONFLICT DO UPDATE`.

### Device Tables

- `devices`: canonical registry keyed by `device_id`
- `device_meta`: structured metadata (e.g. firmware, pioEnv)
- `device_settings`: normalized config fragments keyed by `config_type`

### Node Tables

- `nodes`, `users`, `channels`, `messages`, `connections`

### Metrics & Logs

- `device_metrics`, `telemetry`, `event_emissions`, `packet_logs`

See [`SCHEMA.md`](./SCHEMA.md) for full schema definitions.

---

## 🌐 API Surface

MeshManager exposes a RESTful API for querying device state and metrics.

### Device Endpoints

- `GET /api/v1/devices` — list all devices
- `GET /api/v1/devices/:device_id` — fetch metadata + config fragments
- `GET /api/v1/devices/:device_id/settings/:config_type` — fetch one config fragment

### Node & Packet Endpoints

- `GET /api/v1/nodes`, `GET /api/v1/packets`, `GET /api/v1/nodes/:id/telemetry`, etc.

All handlers are wrapped in `safe()` for error isolation and dry-run safety.

## New IngestionRouter Architecture
## 🧠 Ingestion Flow: Object-Oriented Routing

The ingestion pipeline now treats decoded packets as containers of multiple embedded subtypes. Instead of assuming each packet is atomic, we normalize and route each embedded object independently.

### 🔧 Architectural Overview

1. **Normalization**  
   Decoded packets are parsed into entries. Each entry is scanned for canonical fields (`fromNodeNum`, `toNodeNum`, `rxTime`, etc.) and embedded `oneof` subtypes defined in `proto.json`.

2. **Object Construction**  
   For each `oneof` subtype found, we construct an enriched object containing:
   - The subtype data
   - Canonical fields (e.g. `fromNodeNum`, `rxTime`)
   - A declared `type` for routing

3. **Routing**  
   Each constructed object is dispatched to its dedicated handler based on `type`. This enables modular insert logic, event emission, and diagnostic overlays.

### 📦 Example

```js
{
  fromNodeNum: 12,
  rxTime: 1695620000,
  subPackets: [
    { type: 'nodeInfo', data: { ... } },
    { type: 'configCompleteId', data: { ... } },
    { type: 'logRecord', data: { ... } }
  ]
}

### 📁 Module Placement
This logic lives in core/ingestionRouter.js, replacing the legacy router. It orchestrates normalization, ingestion, and dispatch in a dry-run safe, contributor-friendly flow.

### 📦 Canonical Fields for SubPacket Normalization

During ingestion, each decoded packet is decomposed into embedded subtypes. To preserve lineage, diagnostics, and routing clarity, we attach a consistent set of canonical fields to each constructed `subPacket` object.

| Field           | Description                                                                 |
|----------------|-----------------------------------------------------------------------------|
| `fromNodeNum`   | Source node identifier; critical for lineage and routing                   |
| `toNodeNum`     | Destination node (if applicable); used for directional overlays            |
| `rxTime`        | Timestamp of packet reception; used for time-based diagnostics             |
| `rxSnr`         | Signal-to-noise ratio; useful for radio diagnostics and overlay tagging    |
| `rxRssi`        | Received signal strength indicator; complements `rxSnr`                    |
| `connId`        | Connection identifier from bridge layer; enables multi-stream tracing      |
| `packetId`      | Unique identifier for the full packet (if available); useful for deduping  |
| `transportType` | Transport source (e.g., `tcp`, `mqtt`, `meshRadio`); used for tagging       |
| `channelNum`    | Logical channel number; relevant for Meshtastic and multi-channel routing  |
| `hopLimit`      | Mesh routing metadata; useful for overlay diagnostics                      |
| `portNum`       | Protocol port number; helps classify packet type                           |
| `raw`           | Raw packet bytes (optional); retained for debugging or overlay generation  |

### 🧠 Optional Metadata Fields

| Field           | Description                                                                 |
|----------------|-----------------------------------------------------------------------------|
| `rxDeviceId`    | Device that received the packet; useful for gateway diagnostics             |
| `rxGatewayId`   | Gateway node identifier (if applicable)                                     |
| `rxSessionId`   | Session identifier for multi-connection tracing                             |
| `decodedBy`     | Module or handler that performed decoding                                   |
| `tags`          | Diagnostic or classification tags applied during enrichment                 |

These fields are attached to each `subPacket` object before dispatch, ensuring protocol fidelity, modular routing, and onboarding clarity.

### 🧬 `oneof` Subtypes in FromRadio and MeshPacket

Meshtastic packets often contain embedded subtypes defined via `oneof` fields in the protobuf schema. These subtypes represent distinct message types, each with its own structure and purpose. During ingestion, we extract and route each subtype independently.

#### 📦 `FromRadio` Subtypes

| Subtype             | Purpose / Payload Description                                           |
|---------------------|-------------------------------------------------------------------------|
| `nodeInfo`          | Contains metadata about the sending node (hardware, firmware, etc.)     |
| `configCompleteId`  | Signals that node configuration is complete; used for onboarding flows  |
| `logRecord`         | Carries diagnostic logs from the node                                   |
| `position`          | GPS coordinates and movement metadata                                   |
| `textMessage`       | User-generated message; may include channel and destination info        |
| `telemetry`         | Environmental or device metrics (e.g., battery, temperature)            |
| `heartbeat`         | Periodic signal for node presence and health                           |
| `routing`           | Mesh routing metadata; used for path discovery and optimization         |
| `user`              | User profile info (callsign, avatar, etc.)                              |
| `remoteHardwarePin` | Remote GPIO state or control signal                                     |
| `storeAndForward`   | Packet intended for delayed relay                                       |

#### 📦 `MeshPacket` Subtypes

| Subtype             | Purpose / Payload Description                                           |
|---------------------|-------------------------------------------------------------------------|
| `admin`             | Administrative commands (e.g., reboot, reset)                           |
| `data`              | Generic data payload; often used for app-specific extensions            |
| `compressed`        | Encoded payload for bandwidth efficiency                                |
| `ack`               | Acknowledgment of receipt; used in reliable delivery flows              |
| `routing`           | Routing metadata for mesh pathing                                       |
| `heartbeat`         | Node health and presence signal                                         |
| `telemetry`         | Device or environmental metrics                                         |
| `logRecord`         | Diagnostic logs (may overlap with FromRadio)                            |
| `config`            | Configuration payloads for node setup                                   |
| `user`              | User profile info                                                       |

---

Each `oneof` subtype is extracted during normalization and routed to its dedicated handler. This modular approach ensures protocol fidelity, simplifies onboarding, and supports diagnostic overlays.


---

## 🧑‍💻 Contributor Guide

To add support for a new protocol or config type:

1. Extend `insertDeviceSetting()` with new `config_type`
2. Update `routePacket()` to detect and dispatch the fragment
3. Add query handler and API route if needed
4. Document schema changes in `SCHEMA.md`
5. Annotate insert logic for onboarding clarity

All insert handlers live in `src/db/insert/`, query logic in `src/db/queryHandlers.js`, and API routes in `src/bridge/api/routes.js`.

---

## 📚 Related Docs

- [`SCHEMA.md`](./SCHEMA.md) — full database schema
- [`README.md`](./README.md) — project overview and setup
- [`API.md`](./API.md) — sample responses and usage


## current Status

## 🔗 Subtype → Handler Mapping

## 🔗 Subtype → Handler Mapping

This table documents how each decoded subpacket type is routed through the ingestion pipeline into DB handlers, overlays, and events.

## 🔗 Subtype → Handler Mapping

This table documents how each decoded subpacket type is routed through the ingestion pipeline into DB handlers, overlays, and events.  
All handlers are imported and re‑exported from `insertHandlers.js` for a unified surface.

| Subpacket Type     | Insert/Upsert Handler              | Overlay(s) Emitted   | Event(s) Emitted       | Notes |
|--------------------|------------------------------------|----------------------|------------------------|-------|
| `nodeInfo`         | `upsertNodeInfo`                   | `lineage`            | `configComplete`       | Updates node identity; canonicalizes `num` and `device_id` |
| `logRecord`        | `insertPacketLog`                  | `queueHealth`        | —                      | Persists logs with lineage context |
| `fileInfo`         | `insertFileInfo`                   | —                    | —                      | Stores metadata about shared files |
| `channel`          | `insertChannel`                    | —                    | —                      | Persists channel settings (id, name, role, PSK, uplink/downlink) |
| `queueStatus`      | `insertQueueStatus`                | —                    | —                      | Tracks queue health (res, free, maxlen, meshPacketId) |
| `configCompleteId` | —                                  | —                    | `configComplete`       | Emits lifecycle event only (no DB insert) |
| `position`         | `insertPosition`                   | `position`           | `locationUpdated` (opt)| Dual write: upserts into `nodes` for current state, appends into `positions` for lineage |
| `userInfo`         | `insertUser` / `insertNodeUsers`   | —                    | —                      | Persists user metadata linked to nodes |
| `metrics`          | `insertNodeMetrics` / `insertDeviceMetrics` | —           | —                      | Persists telemetry/metrics at node and device level |
| `telemetry`        | `insertTelemetry`                  | —                    | —                      | Persists raw telemetry packets |
| `eventEmission`    | `insertEventEmission`              | —                    | —                      | Persists lifecycle events for audit/diagnostics |
| `message`          | `insertMessage`                    | —                    | —                      | Persists text/data messages |
| `connection`       | `insertConnection`                 | —                    | —                      | Persists connection/session info |
| `device`           | `insertDevice`                     | —                    | —                      | Persists device metadata |
| `deviceSetting`    | `insertDeviceSetting`              | —                    | —                      | Persists device configuration settings |
| `deviceMeta`       | `insertDeviceMeta`                 | —                    | —                      | Persists device‑level metadata |
| `packetLog`        | `insertPacketLog` / `injectPacketLog` | —                  | —                      | Persists or injects packet logs for replay/diagnostics |
| `ipMap`            | `upsertDeviceIpMap` / `lookupDeviceIpMap` | —              | —                      | Maintains device ↔ IP mapping |
| `node`             | `insertNode` / `deleteNode`        | —                    | —                      | Creates or deletes node records |

---

### 📘 Contributor Notes

- **Unified surface**: Always import from `insertHandlers.js`. Even if a handler lives in its own file, it’s re‑exported here.  
- **Unhandled subtypes**: Still exist (`telemetry`, `routing`, `neighborInfo`, etc.) — add schema, handler, fixture, and tests when implementing.  
- **Consistency**: Always attach `connId` and `timestamp` when persisting.  
- **Observability**: Emit overlays/events where appropriate.  
- **Extensibility**: Update this table whenever a new subtype is implemented or a handler is added.  

---

### 📘 Contributor Notes

- **Unhandled subtypes** are explicitly listed above. Each corresponds to a `oneof` field in `FromRadio` or `MeshPacket` from `proto.json`.  
- When implementing support:
  1. Add schema in `schemaValidator.js`
  2. Add handler in `dispatchRegistry.js`
  3. Add fixture in `test/fixtures/packets.js`
  4. Add tests (unit, integration, E2E)
- **Consistency**: Always attach `connId` and `timestamp` when persisting to DB.  
- **Observability**: Emit overlays for diagnostic visibility; emit events for lifecycle triggers.  
- **Extensibility**: Update this table whenever a new subtype is implemented.  

---

### 📘 Contributor Notes

- **Adding a new subtype** requires:
  1. Schema entry in `schemaValidator.js`
  2. Handler in `dispatchRegistry.js`
  3. Fixture in `test/fixtures/packets.js`
  4. Tests in `schemaValidator.test.js`, `ingestionPipeline.test.js`, and `ingestion.e2e.test.js`

- **Consistency**: Always attach `connId` and `timestamp` when persisting to DB.  
- **Observability**: Emit overlays for diagnostic visibility; emit events for lifecycle triggers.  
- **Extensibility**: This table should be updated whenever a new subtype is added.  

📘 Contributor Notes
1.  DB Handler: You’ll need to scaffold insertHandlers.insertPosition() in insertHandlers.js.
2. Schema: Add required fields (latitude, longitude, altitude) in schemaValidator.js.
3. Fixture: Create a position fixture in test/fixtures/packets.js with a canonical encoded buffer.
4. Tests: Add unit, integration, and E2E tests using decodeFixture('position', meta, true).
5. Overlays/Events: Decide which overlays (e.g. position, mapTrace) and events (locationUpdated) make sense for your UI.


### Telemetry Metrics Ingestion

- **Port 67 (Telemetry)** MeshPacket → decoded in `packetMeshPacket.js` → normalized `{ type: 'telemetry', data, meta }`.
- **Dispatch**: `dispatchRegistry['telemetry']` → calls `insertMetricsHandler`.
- **Metrics Handler**: Splits telemetry into groups and calls the appropriate insert function from `insertMetrics.js`.

| Metric Group         | Insert Function                        | Table                |
|----------------------|----------------------------------------|----------------------|
| `deviceMetrics`      | `insertDeviceMetrics`                  | `device_metrics`     |
| `environmentMetrics` | `insertEnvironmentMetrics`             | `environment_metrics` |
| `airQualityMetrics`  | `insertAirQualityMetrics`              | `air_quality_metrics` |
| `powerMetrics`       | `insertPowerMetrics`                   | `power_metrics`      |
| `localStats`         | `insertLocalStats`                     | `local_stats`        |
| `healthMetrics`      | `insertHealthMetrics`                  | `health_metrics`     |
| `hostMetrics`        | `insertHostMetrics`                    | `host_metrics`       |

**Contributor Notes**:  
- Always attach `fromNodeNum`, `toNodeNum`, and `timestamp`.  
- Each metric group is optional; handler inserts only what’s present.  
- Adding a new group requires schema, insert function, and test fixtures.  

## new architecture flow
Transport (TCP / WebSocket / MQTT)
        │
        ▼
   bridge/handlers
        │
        ▼
   core/ingestionRouter.js
        │
        ├─► decodeMeshPacket()       (for meshPacket oneof)
        │
        ├─► decodeFromRadioPacket()  (for other FromRadio oneofs)
        │
        ▼
   Enrichment
     • connId
     • timestamp
     • fromNodeNum / toNodeNum
     • device_id (from cache)
        │
        ▼
   dispatchSubPacket()
        │
        ▼
   dispatchRegistry[type]
        │
        ├─► insertHandlers / * (DB persistence)
        ├─► overlayEmitter   (diagnostic overlays)
        └─► eventEmitter     (lifecycle/system events)



“The FromRadio oneof group includes diagnostic and config packets like config, moduleConfig, logRecord, and fileInfo. These are decoded and routed to specialized insert handlers or logged for debugging. Malformed or unsupported packets are annotated and skipped to preserve ingest stability.”
