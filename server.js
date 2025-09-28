// server.js
import express from 'express';
import { config } from './src/config/config.js';
import runtimeConfigRoutes from './src/routes/runtimeConfigRoutes.js';
import createWebsocketSessionHandler from './src/handlers/websocketSessionHandler.js';
import createMQTTHandler from './src/handlers/mqttHandler.js';
import createTCPServer from './src/handlers/tcpServerHandler.js';
import ingestionRouter from './src/core/ingestionRouter.js';
import { registerRoutes } from './src/api/routes.js';
import createMeshHandler from './src/handlers/meshHandler.js';
import { initProtoTypes } from './src/packets/packetDecoders.js';
import { shutdown } from './src/utils/servicesManager.js';

await initProtoTypes(); // sets up decode + encode

// --- Mesh connection ---
global.mesh = createMeshHandler(
  'mesh-1',
  process.env.DEVICE_IP || '192.168.1.52',
  process.env.DEVICE_PORT || 4403,
  ingestionRouter.routePacket
);

// --- Express API ---
const app = express();
app.use(express.json());
app.use('/api/v1/config', runtimeConfigRoutes);
app.get('/', (req, res) => res.send('MeshManager v2 is running'));
registerRoutes(app);

// --- Start API Server ---
global.apiServer = app.listen(config.api.port, () => {
  console.log(`🛠 Express server listening on port ${config.api.port}`);
});

// --- WebSocket ---
global.wsServer = createWebsocketSessionHandler({ port: config.websocket.port });

// --- MQTT ---
global.mqttHandler = createMQTTHandler('mqtt-bridge', {
  brokerUrl: config.mqtt.brokerUrl,
  subTopic: config.mqtt.subTopic,
  pubOptions: config.mqtt.pubOptions
});
global.mqttHandler.connect();

// --- TCP Server ---
global.tcpServer = createTCPServer('tcp-bridge', config.tcp.host, config.tcp.port, {
  onConnect: (id) => console.log(`[TCP ${id}] Connected`),
  onFrame: (id, frame) => ingestionRouter.routePacket(frame, { source: 'tcp', connId: id }),
  onError: (id, err) => console.error(`[TCP ${id}] Error:`, err.message),
  onClose: (id) => console.warn(`[TCP ${id}] Closed`)
});

// --- Graceful Shutdown ---
['SIGINT', 'SIGTERM'].forEach(sig => {
  process.on(sig, () => shutdown(sig));
});
