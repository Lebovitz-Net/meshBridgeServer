// scripts/testMQTTIngestion.js
import createMQTTHandler from '../handlers/mqttHandler.js';
import { routePacket } from '../core/ingestionRouter.js';

// Simulated decoded packet
const mockPacket = {
  type: 'FromRadio',
  nodeInfo: {
    node_id: 'node-123',
    label: 'TestNode',
    user: { id: 'user-456' }
  },
  channelInfo: {
    channel_id: 'chan-789',
    name: 'TestChannel'
  },
  message: {
    id: 'msg-001',
    sender: 'user-456',
    content: 'Hello from MQTT!',
    timestamp: Date.now()
  },
  telemetry: {
    battery: 3.7,
    temp: 22.5
  },
  connection: {
    id: 'conn-abc',
    transport: 'mqtt',
    status: 'ready'
  },
  raw: { simulated: true }
};

// Create handler and connect
const mqttHandler = createMQTTHandler('test-mqtt', {
  brokerUrl: 'mqtt://broker.hivemq.com',
  subTopic: 'meshtastic/testnode/#'
});

mqttHandler.connect();

// Simulate ingestion
setTimeout(() => {
  console.log('🔬 Injecting mock packet into ingestionRouter...');
  routePacket(mockPacket, { source: 'mqtt', sourceId: 'test-mqtt' });
}, 2000);

// Optional: publish back to broker
setTimeout(() => {
  console.log('📤 Publishing mock packet to broker...');
  mqttHandler.publish(mockPacket);
}, 4000);

// Graceful shutdown
setTimeout(() => {
  mqttHandler.disconnect();
  console.log('✅ MQTT test complete');
}, 6000);
