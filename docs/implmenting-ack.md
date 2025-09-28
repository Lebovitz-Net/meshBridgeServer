# 📡 ACK Tracking Integration in Mesh Dashboard

## 🧠 Overview

ACK tracking ensures reliable packet delivery across mesh networks by correlating outbound requests with inbound acknowledgments. It’s especially critical when using `wantAck` in Meshtastic-style protocols, where delivery guarantees matter for config, routing, or telemetry.

## 🔧 Frontend Integration

### 1. Attach `txId` to Outgoing Packets

```js
const txId = `${Date.now()}-${nodeId}`;
send(JSON.stringify({
  command: 'getConfig',
  txId,
  wantAck: true
}));
```

* txId must be unique per request
* wantAck: true signals the device to respond with an ACK

2. Track Pending ACKs

```js
const pendingAcks = useRef(new Map()); // txId → { timestamp, retries, originalPacket }

function trackAck(txId, packet) {
  pendingAcks.current.set(txId, {
    timestamp: Date.now(),
    retries: 0,
    originalPacket: packet
  });
}

function clearAck(txId) {
  pendingAcks.current.delete(txId);
}
```

3. Detect Incoming ACKs

```js
function handleMessage(data) {
  const parsed = typeof data === 'string' ? JSON.parse(data) : decodeBinary(data);

  if (parsed?.ack && parsed?.txId) {
    clearAck(parsed.txId);
    console.log(`[ACK] Received for txId ${parsed.txId}`);
  }

  // Continue with normal decode flow...
}
```

4. Retry & Timeout Logic

```js
useEffect(() => {
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [txId, meta] of pendingAcks.current.entries()) {
      if (now - meta.timestamp > 5000) {
        if (meta.retries < 3) {
          send(meta.originalPacket);
          meta.retries += 1;
          meta.timestamp = now;
          console.log(`[ACK] Retrying txId ${txId} (attempt ${meta.retries})`);
        } else {
          console.warn(`[ACK] Timeout for txId ${txId}`);
          pendingAcks.current.delete(txId);
        }
      }
    }
  }, 1000);

  return () => clearInterval(interval);
}, []);
🔌 Bridge Proxy Integration
1. Generate & Attach txId
js
const txId = `${Date.now()}-${nodeId}`;
packet.txId = txId;
packet.wantAck = true;

pendingAcks[txId] = {
  timestamp: Date.now(),
  retries: 0,
  originalPacket: packet
};

mesh.send(packet);
2. Detect ACKs from Mesh Device
js
if (packet.ack && packet.txId && pendingAcks[packet.txId]) {
  delete pendingAcks[packet.txId];
  ws.send(JSON.stringify({ type: 'ack', txId: packet.txId }));
}
3. Retry Logic in Proxy
js
setInterval(() => {
  const now = Date.now();
  for (const [txId, meta] of Object.entries(pendingAcks)) {
    if (now - meta.timestamp > 5000) {
      if (meta.retries < 3) {
        mesh.send(meta.originalPacket);
        meta.retries += 1;
        meta.timestamp = now;
        console.log(`[BridgeProxy] Retrying txId ${txId} (attempt ${meta.retries})`);
      } else {
        console.warn(`[BridgeProxy] ACK timeout for txId ${txId}`);
        delete pendingAcks[txId];
      }
    }
  }
}, 1000);
```
🧩 Optional Enhancements
•	Surface pendingAcks.size to UI for diagnostics
•	Annotate nodes with last ACK timestamp
•	Add ackReceived, ackTimeout events to protocol state machine
•	Normalize ACK handling across TCP, MQTT, BLE
•	Scaffold useAckTracker() as a reusable hook
✅ Summary
ACK tracking adds reliability, observability, and teachability to your mesh dashboard. It requires coordinated changes across:
•	Frontend hooks (useTCPNodes, useMeshLifecycle)
•	Bridge proxy (packet tagging, retry logic)
•	Protocol scaffolds (ACK detection, state transitions)
This integration ensures delivery guarantees, supports retries, and enables diagnostic overlays for debugging and onboarding.
Code


