📦 Bridge Packet Decoding Architecture
🧱 Directory Structure
Code
bridge/
├── packets/
│   ├── packetDecoders.js
│   ├── decodeNodeInfo.js
│   ├── decodeTelemetry.js
│   ├── decodeDeviceMetrics.js   ← ✅ Add this
│   ├── decodePosition.js        ← ✅ Add this
│   ├── decodeRouting.js         ← ✅ Add this
│   ├── decodeConfig.js          ← ✅ Add this
│   └── decodeTextMessage.js     ← ✅ Add this
🧩 Missing Decoders to Add
Each decoder accepts a raw protobuf buffer and returns a normalized packet object.

decodeDeviceMetrics.js
js
export function decodeDeviceMetrics(buffer, DeviceMetrics) {
  const decoded = DeviceMetrics.decode(buffer);
  return {
    type: 'DeviceMetrics',
    timestamp: decoded.timestamp || Date.now(),
    payload: {
      batteryLevel: decoded.batteryLevel,
      temperature: decoded.temperature,
      memoryFree: decoded.memoryFree,
      voltage: decoded.voltage
    }
  };
}
decodePosition.js
js
export function decodePosition(buffer, Position) {
  const decoded = Position.decode(buffer);
  return {
    type: 'Position',
    timestamp: decoded.timestamp || Date.now(),
    payload: {
      latitude: decoded.latitude,
      longitude: decoded.longitude,
      altitude: decoded.altitude,
      batteryLevel: decoded.batteryLevel
    }
  };
}
decodeRouting.js
js
export function decodeRouting(buffer, Routing) {
  const decoded = Routing.decode(buffer);
  return {
    type: 'Routing',
    timestamp: decoded.timestamp || Date.now(),
    payload: {
      hopLimit: decoded.hopLimit,
      seenNodes: decoded.seenNodes,
      neighbors: decoded.neighbors
    }
  };
}
decodeConfig.js
js
export function decodeConfig(buffer, Config) {
  const decoded = Config.decode(buffer);
  return {
    type: 'Config',
    timestamp: decoded.timestamp || Date.now(),
    payload: {
      channelSettings: decoded.channelSettings,
      pskFingerprint: decoded.pskFingerprint,
      modemConfig: decoded.modemConfig
    }
  };
}
decodeTextMessage.js
js
export function decodeTextMessage(buffer, TextMessage) {
  const decoded = TextMessage.decode(buffer);
  return {
    type: 'TextMessage',
    timestamp: decoded.timestamp || Date.now(),
    payload: {
      sender: decoded.sender,
      message: decoded.message,
      ack: decoded.ack,
      rxTime: decoded.rxTime
    }
  };
}
🔌 Interface with bridgeAdapter.js
🔁 Flow Summary
Raw packet arrives via TCP/WebSocket

bridgeAdapter.js invokes decodeAndNormalize(buffer, source)

decodeAndNormalize():

Strips framing header

Attempts decode as FromRadio or MeshPacket

If MeshPacket, uses portnum to select decoder from packetDecoders.js

If FromRadio, extracts embedded nodeInfo directly

Normalized packet is returned with:

type

timestamp

payload

nodeId

source

bridgeAdapter.js injects connId and forwards to UI via sendWS('frame', packet)

🧠 Example Forwarding
js
const decoded = decodeAndNormalize(buffer, 'tcp');
sendWS('frame', {
  ...decoded,
  connId
});
🧼 Notes
All decoders assume protobuf types are initialized via initProtoTypes()

packetDecoders.js centralizes decoder logic for maintainability

bridgeAdapter.js acts as the transport-to-UI bridge, injecting connId and forwarding normalized packets


## -------------------------------------------------------------------------------------------------------

New Architecture for decoding, normalizing, ingesting, and routine objects from the mesh device

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



## 🧠 `decodeAndNormalize` Output

The `decodeAndNormalize()` function is the first step in the ingestion pipeline. It accepts raw packet bytes (typically from TCP, MQTT, or mesh radio) and returns a structured, mostly object-based representation of the decoded packet.

### 🔧 Responsibilities

- **Frame Parsing**: Applies sync byte checks, length validation, and framing logic.
- **Protobuf Decoding**: Uses `proto.json` definitions to decode the binary payload into a structured object.
- **Transport Metadata Injection**: Attaches metadata such as `connId`, `transportType`, and `rxTime` to the decoded object.
- **Normalization**: Converts nested protobuf structures into plain JavaScript objects for easier downstream processing.

### 📦 Output Format

The result is typically a single decoded packet object or an array of packet entries, depending on the transport and framing:

```js
{
  fromNodeNum: 12,
  rxTime: 1695620000,
  connId: "abc123",
  transportType: "tcp",
  nodeInfo: { ... },              // oneof subtype
  configCompleteId: { ... },      // optional additional subtype
  logRecord: { ... }              // optional additional subtype
}
```

## 🔀 Object Routing Design

The Object Routing layer is the heart of the post-decode ingestion pipeline. It replaces the legacy `ingestionRouter` with a modular, protocol-faithful system that decomposes decoded packets into enriched subpacket objects and dispatches each to its dedicated handler.

### 🧠 Purpose

- Normalize decoded packets into discrete subpacket objects  
- Attach canonical fields for lineage, diagnostics, and routing  
- Dispatch each object to its handler with dry-run safety  
- Emit overlays and events for observability

### 🧩 Responsibilities

1. **Entry Parsing**  
   Accepts decoded output from `decodeAndNormalize()`—either a single object or an array of entries.

2. **Canonical Field Extraction**  
   Extracts key metadata from each entry:
   - `fromNodeNum`, `rxTime`, `connId`, `transportType`, etc.

3. **Subtype Identification**  
   Scans each entry for embedded `oneof` subtypes defined in `proto.json` for `FromRadio` or `MeshPacket`.

4. **Object Construction**  
   For each subtype found, constructs an enriched object:
   ```js
   {
     type: 'nodeInfo',
     fromNodeNum: 12,
     rxTime: 1695620000,
     connId: 'abc123',
     transportType: 'tcp',
     data: { ... }
   }


#### Dispatch Routes each object to its handler based on type. Handlers may:

1. Insert into DB (insertNodeInfo, insertLogRecord)

2. Emit events (emitConfigComplete)

3.  Generate overlays (emitLineageOverlay, emitQueueHealth)

### 📁 Module Breakdown
### 📁 Module Breakdown

| Module                    | Role                                                                 | Status       |
|---------------------------|----------------------------------------------------------------------|--------------|
| `core/ingestionRouter.js` | Main entry point for object routing                                  | **Planned**  |
| `normalizeDecodedPacket.js` | Parses entries and extracts canonical fields                       | **Scaffolded** |
| `extractOneofSubtypes.js` | Identifies valid subtypes from `proto.json`                          | **Planned**  |
| `dispatchSubPacket.js`    | Routes each object to its handler                                    | **Planned**  |
| `schemaValidator.js`      | Validates object structure before dispatch                           | **Existing** |

## 🔧 Refactor Plan: PacketDecoder and PacketUtils

To support the new object routing architecture, we are refactoring `PacketDecoder.js` and `PacketUtils.js` to cleanly separate decoding, normalization, and subtype extraction. These modules will prepare decoded packets for ingestion by `ingestionRouter.js`.

---

### 📦 PacketDecoder.js

This module handles raw byte input and produces structured decoded entries. To support object routing, we are enhancing it with the following:

#### ✅ Enhancements

- **Ensure output is always an array**  
  Wrap single decoded packets in an array for consistent downstream handling.

- **Attach `sourceType`**  
  Tag each decoded entry with `sourceType: 'fromRadio'` or `'meshPacket'` to guide oneof subtype extraction.

- **Inject canonical fields early**  
  Attach metadata such as `connId`, `rxTime`, `transportType`, and optionally `raw` to each decoded entry.

- **Emit decode summary logs**  
  Log how many entries were decoded, from which connection, and what transport.

#### 📦 Output Format (Post-Refactor)

```js
[
  {
    sourceType: 'fromRadio',
    fromNodeNum: 12,
    rxTime: 1695620000,
    connId: 'abc123',
    transportType: 'tcp',
    raw: <Buffer>,
    nodeInfo: { ... },
    configCompleteId: { ... }
  },
  ...
]

## 🧩 PacketUtils.js

This module provides reusable helpers for normalization and subtype decomposition.

### ✨ New Helpers

- `extractCanonicalFields(entry)`  
  Extracts `fromNodeNum`, `rxTime`, `connId`, `transportType`, and other metadata from a decoded entry.

- `getOneofSubtypes(entry, sourceType)`  
  Returns a list of valid `oneof` keys based on `proto.json` and the packet’s `sourceType`.

- `constructSubPacket(entry, subtype)`  
  Builds the enriched object for routing:
  ```js
  {
    type: subtype,
    ...canonicalFields,
    data: entry[subtype]
  }

🔀 Integration Path
Once these helpers are in place:

PacketDecoder.js handles raw → decoded object(s)

PacketUtils.js handles decoded → normalized subpacket objects

ingestionRouter.js handles subpacket → handler dispatch

This modular flow ensures protocol fidelity, dry-run safety, and onboarding clarity.

📁 Module Breakdown
Module	Role	Status
core/ingestionRouter.js	Main entry point for object routing	Planned
normalizeDecodedPacket.js	Parses entries and extracts canonical fields	Scaffolded
extractOneofSubtypes.js	Identifies valid subtypes from proto.json	Planned
dispatchSubPacket.js	Routes each object to its handler	Planned
schemaValidator.js	Validates object structure before dispatch	Existing
📦 Benefits
Protocol Fidelity: Reflects actual structure of FromRadio and MeshPacket

Modularity: Each subtype has its own handler and overlay logic

Onboarding Clarity: Contributors can trace packet flow from decode to dispatch

Dry-Run Safety: Each object is validated and logged before mutation

This design ensures that multi-subtype packets are decomposed and processed with clarity, traceability, and architectural rigor.

### Notes to contributers for new files and functions

## 🔀 Dispatch Flow: Subpacket Routing

The `dispatchSubPacket()` function is the final step in the object routing pipeline. It receives enriched subpacket objects and routes each to its handler based on `type`.

### 🧩 Responsibilities

- Invoke the correct insert handler for each subtype  
- Emit overlays for observability (`emitOverlay`)  
- Emit events for downstream triggers (`emitEvent`)  
- Log unhandled types for future extension

### 🧱 Dispatch Structure

```js
switch (type) {
  case 'nodeInfo':
    insertHandlers.upsertNodeInfo(data);
    emitOverlay('lineage', subPacket);
    emitEvent('configComplete', subPacket);
    break;

  case 'logRecord':
    insertHandlers.insertLogRecord({ ... });
    emitOverlay('queueHealth', subPacket);
    break;

  case 'configCompleteId':
    emitEvent('configComplete', subPacket);
    break;

  default:
    console.warn(`[dispatchSubPacket] Unhandled type: ${type}`);
}
```

🧠 Notes for Contributors
Each case block is a modular handler for a specific subtype

Handlers may insert into DB, emit overlays, or trigger events

All dispatches are dry-run safe and log unhandled types

Extend this file as new subtypes are added to proto.json

Let me know if you want to scaffold emitOverlay() or document this dispatch registry in ARCHITECTURE.md. We’re nearly at full ingestion clarity.

## 🔀 Object Routing Pipeline

This section documents the full lifecycle of packet ingestion in meshmanager v2, from raw bytes to dispatched subpacket handlers. The pipeline is modular, protocol-faithful, and designed for onboarding clarity.

---

### 🧱 Pipeline Overview

```mermaid
flowchart TD
  A[Raw Bytes] --> B[decodeAndNormalize()]
  B --> C[normalizeDecodedPacket()]
  C --> D[dispatchSubPacket()]
  D --> E[Insert Handler / Overlay / Event]

## 📁 Module Breakdown

| Module                    | Role                                                                 | Status         |
|---------------------------|----------------------------------------------------------------------|----------------|
| `core/ingestionRouter.js` | Main entry point for object routing                                  | **Planned**    |
| `normalizeDecodedPacket.js` | Parses entries and extracts canonical fields                        | **Scaffolded** |
| `extractOneofSubtypes.js` | Identifies valid subtypes from `proto.json`                          | **Planned**    |
| `dispatchSubPacket.js`    | Routes each object to its handler                                    | **Planned**    |
| `schemaValidator.js`      | Validates object structure before dispatch                           | **Existing**   |

---

## 📦 Benefits

- **Protocol Fidelity**: Reflects actual structure of `FromRadio` and `MeshPacket`  
- **Modularity**: Each subtype has its own handler and overlay logic  
- **Onboarding Clarity**: Contributors can trace packet flow from decode to dispatch  
- **Dry-Run Safety**: Each object is validated and logged before mutation  

---

This design ensures that multi-subtype packets are decomposed and processed with clarity, traceability, and architectural rigor.

Contributor Notes
To add a new subtype:

Add it to proto.json

Ensure it’s decoded in decodeAndNormalize

Add a handler in dispatchRegistry.js

This avoids editing dispatchSubPacket.js every time

Keeps routing logic clean and modular

👉 Next step after this: scaffold a schema validator (schemaValidator.js) so every subpacket is validated before dispatch. That way, malformed or incomplete objects never hit the DB or overlays.

Do you want me to scaffold that validator next?

so we removed the giant witch statement in favor of this shorter version of dispatchSubPacket
Exactly 👍 — that’s the big architectural win here.

By moving from the giant switch statement to a dispatch registry + short dispatcher, we’ve:

Decoupled logic: dispatchSubPacket() is now just a thin router, not a wall of branching logic.

Centralized handlers: All subtype-specific logic lives in dispatchRegistry.js, where each handler is modular and easy to extend.

Improved onboarding clarity: New contributors don’t have to scroll through hundreds of lines of switch cases—they just add a new entry in the registry.

Dry-run safety: Unhandled types are logged cleanly, instead of silently falling through.

Future extensibility: We can add metrics, counters, or even dynamic handler loading without touching the dispatcher itself.

So the flow is now:

mermaid
flowchart TD
  A[Decoded Entry] --> B[normalizeDecodedPacket()]
  B --> C[dispatchSubPacket()]
  C --> D{dispatchRegistry}
  D -->|nodeInfo| E[upsertNodeInfo + overlays/events]
  D -->|logRecord| F[insertLogRecord + overlays]
  D -->|configCompleteId| G[emit configComplete event]
  D -->|unhandled| H[warn log]
📘 Contributor Note
Old way: Add a new case to a giant switch in ingestionRouter.js

New way: Add a new handler function in dispatchRegistry.js and you’re done