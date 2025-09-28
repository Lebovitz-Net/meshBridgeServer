[ React UI ]
     │  (one persistent WS)
     ▼
[ WebSocketHandler.js ]
     ├── TCP conn #1 (node/channel A)
     ├── TCP conn #2 (node/channel B)
     └── TCP conn #3 (node/channel C)


# Mesh Bridge Architecture — Persistent Multi‑TCP WebSocket Design

## Overview
We have refactored the bridge architecture to support **persistent WebSocket connections** between the UI and the backend, while allowing **multiple independent TCP connections** to be managed under a single WebSocket session.

This change moves us away from the old **1‑WebSocket ↔ 1‑TCP** model, where any TCP lifecycle event would close the WebSocket, toward a **1‑WebSocket ↔ N‑TCP** model with **failure isolation** and **automatic recovery**.

---

## Goals of the Refactor
- **Persistence** — Keep the WebSocket alive for the lifetime of the UI session.
- **Decoupling** — Separate UI lifecycle from TCP lifecycle.
- **Failure Isolation** — One TCP connection failing should not close the WebSocket or other TCP connections.
- **Scalability** — Support multiple TCP streams (devices, channels, or logical streams) under one WS.
- **Extensibility** — Make it easy to add per‑connection state machines, heartbeats, and reconnection strategies.

---

## Key Architectural Changes

### 1. WebSocket Handler (`webSocketHandler.js`)
**Old Behavior:**
- Bound to a single TCP connection (`activeSession`).
- Closed the WebSocket on *any* TCP error, timeout, or close.
- No support for multiple TCP connections.

**New Behavior:**
- Manages a **registry** of TCP connections per WebSocket session:
  ```js
  tcpConnections: Map<connId, { tcp, host, port, reconnectTimer }>
Routes incoming TCP frames to the WS client with connId tagging.

Accepts WS control messages:

open_channel → create new TCP connection.

close_channel → close one TCP connection.

send → send data to a specific TCP connection.

Keeps WS alive even if one or more TCP connections drop.

Sends status events to UI (channel_status, frame) instead of closing WS.

2. TCP Handler (tcpHandler.js)
Old Behavior (tcpClient.js):

Single connection only.

No awareness of connId.

Shared state assumptions (e.g., activeSession).

Lifecycle events closed the WS directly.

New Behavior (tcpHandler.js):

Fully instance‑safe — no shared globals.

Accepts connId and passes it to all event callbacks.

Exposes clean API:

js
write(data)
end()
isConnected()
socket // raw net.Socket
Preserves frame parsing logic (START1/START2 sync, length checks).

Lifecycle events (onConnect, onFrame, onError, etc.) are per instance.

Logging includes connId for traceability.

3. Connection Lifecycle
WebSocket: Opened once per UI session, closed only on:

WS network failure

Explicit UI disconnect

Fatal bridge error

TCP Connections: Opened/closed independently via WS commands.

Automatic reconnect on recoverable errors (timeouts, transient network loss).

Status updates sent to UI without dropping WS.

4. Failure Classification
Recoverable (WS stays open, TCP reconnects):

TCP idle timeout

Temporary network drop

Remote TCP close without fatal reason

Unrecoverable (WS closes):

Authentication failure

Protocol negotiation failure

Permanent target unreachable after retries

Explicit admin disconnect

Protocol violation / corrupted stream

Benefits
UI Resilience — UI can refresh or switch tabs without losing backend state.

Better UX — Users see per‑channel status instead of a full disconnect.

Scalable — Ready for multiple devices/channels without architectural changes.

Maintainable — Clear separation of concerns between WS session management and TCP connection handling.

Next Steps
Implement per‑connection protocolState machines for richer UI state.

Add heartbeat/keepalive frames to prevent TCP idle timeouts.

Define mapping between Meshtastic “channels” and TCP connections or logical streams.

Add configurable reconnect backoff and retry limits.

File Summary
bridge/webSocketHandler.js — Manages persistent WS sessions and multiple TCP connections.

bridge/tcpHandler.js — Creates and manages a single TCP connection instance, tagged with connId.

markdown
## WebSocket Message Formats

### Control Messages (UI → Bridge)
| Action         | Description | Example Payload |
|----------------|-------------|-----------------|
| `open_channel` | Request the bridge to open a new TCP connection to a target host/port. | `{ "action": "open_channel", "target": { "host": "192.168.1.50", "port": 4403 } }` |
| `close_channel`| Close a specific TCP connection by `connId`. | `{ "action": "close_channel", "connId": "abc123" }` |
| `send`         | Send raw data to a specific TCP connection. | `{ "action": "send", "connId": "abc123", "data": "<base64 or binary>" }` |

---

### Event Messages (Bridge → UI)
| Type            | Description | Example Payload |
|-----------------|-------------|-----------------|
| `channel_status`| Status update for a TCP connection. | `{ "type": "channel_status", "connId": "abc123", "status": "ready" }` |
| `frame`         | A decoded TCP frame from a specific connection. | `{ "type": "frame", "connId": "abc123", "packet": { "type": "nodeInfo", "payload": { ... } } }` |
| `status`        | General WS/bridge status (optional). | `{ "type": "status", "status": "connecting", "detail": "Reconnecting TCP..." }` |

---

## Sequence Diagrams

### 1. WebSocket Connect → TCP Open → Frame Flow
```mermaid
sequenceDiagram
    participant UI
    participant WSHandler
    participant TCPHandler

    UI->>WSHandler: WebSocket handshake
    WSHandler->>UI: { type: "status", status: "connected" }
    UI->>WSHandler: { action: "open_channel", target: { host, port } }
    WSHandler->>TCPHandler: createTCPHandler(connId, host, port)
    TCPHandler->>WSHandler: onConnect(connId)
    WSHandler->>UI: { type: "channel_status", connId, status: "ready" }
    TCPHandler->>WSHandler: onFrame(connId, frame)
    WSHandler->>UI: { type: "frame", connId, packet }
2. TCP Failure → Reconnect Without WS Drop
mermaid
sequenceDiagram
    participant UI
    participant WSHandler
    participant TCPHandler

    TCPHandler->>WSHandler: onTimeout(connId)
    WSHandler->>UI: { type: "channel_status", connId, status: "timeout" }
    WSHandler->>TCPHandler: scheduleReconnect(connId)
    TCPHandler->>WSHandler: onConnect(connId) (after retry)
    WSHandler->>UI: { type: "channel_status", connId, status: "ready" }
Notes for Contributors
WS stays alive unless an unrecoverable event occurs (auth fail, protocol violation, etc.).

TCP connections are independent — one can fail/reconnect without affecting others.

connId is the routing key — every message/event is tagged so the UI knows which channel it belongs to.

Frame parsing remains in tcpHandler.js — WS handler only routes and manages lifecycle.


## Mesh Bridge Design

### Role in the Architecture
The mesh bridge is the **translation and routing layer** between raw TCP frames from devices and structured WebSocket events consumed by the UI.  
It is **not** responsible for connection lifecycle management — that is handled by the WebSocket and TCP handlers — but instead focuses on:

- **Packet decoding** — Normalizing raw TCP frames into structured packet objects.
- **Filtering** — Dropping irrelevant or malformed packets before they reach the UI.
- **Routing** — Tagging packets with their `connId` so the UI knows which TCP connection (device/channel) they came from.
- **Forwarding** — Sending structured events to the WebSocket session for delivery to the UI.

### Design Principles
- **Stateless with respect to connections**  
  The bridge does not store or manage active TCP/WS sessions. It receives a reference to the WS send function (or equivalent) from the WS handler.
  
- **Multi‑connection aware**  
  All packets are associated with a `connId` provided by the TCP handler. This allows the UI to differentiate between multiple devices/channels over a single WS session.

- **Single responsibility**  
  The bridge’s only job is to process and forward packets — it does not open/close sockets, schedule reconnects, or manage heartbeats.

- **Extensible packet processing**  
  The decoding and filtering logic can be extended to handle new packet types without changing the WS or TCP handlers.

### Data Flow
1. **TCP Handler** receives a raw frame from a device.
2. **TCP Handler** decodes the frame into a packet object.
3. **TCP Handler** calls `processLocalPacket(connId, packet)` on the mesh bridge.
4. **Mesh Bridge**:
   - Validates packet type.
   - Optionally enriches or normalizes data.
   - Forwards `{ type: 'frame', connId, packet }` to the WS handler for delivery to the UI.

### Benefits of This Design
- **Loose coupling** — The bridge can be reused in other contexts (e.g., CLI tools, headless services) without modification.
- **Scalability** — Adding more TCP connections or packet types does not require changes to the WS handler.
- **Clarity** — Each layer (WS handler, TCP handler, mesh bridge) has a well‑defined role.
This way, the doc captures the architectural intent:

meshBridge is now a pure packet processor and router, not a session manager.

It’s multi‑connection aware via connId.

It’s stateless and loosely coupled to the transport layers.

## Design Goals for the MQTT Bridge

Multi‑connection aware

Tag all packets with a sourceId (e.g., "mqtt") and possibly a connId if we later support multiple MQTT brokers or topics.

Stateless packet processing

Don’t assume processLocalPacket is single‑session; always pass sourceId so the mesh bridge can route correctly.

Configurable broker/topic

Allow broker URL and subscription topics to be passed in or loaded from config.

Lifecycle resilience

Handle reconnects, errors, and subscription re‑establishment.

Symmetry with TCP handler

Expose a clean API: connect(), publish(packet), disconnect().

Logging clarity

Prefix logs with [MQTT <sourceId>] for traceability.

