import express from 'express';
import { createServer } from 'http';
import { config } from './src/config/config.js';
import runtimeConfigRoutes from './src/routes/runtimeConfigRoutes.js';
import createMQTTHandler from './src/handlers/mqttHandler.js';
import ingestionRouter from './src/core/ingestionRouter.js';
import ingestionHandler from './src/handlers/ingestionHandler.js';
import { registerRoutes } from './src/api/routes.js';
import createMeshHandler from './src/handlers/meshHandler.js';
import { initProtoTypes } from './src/packets/packetDecoders.js';
import { shutdown } from './src/utils/servicesManager.js';

await initProtoTypes(); // sets up decode + encode logic

// --- Mesh connection (outbound TCP client) ---
const mesh = createMeshHandler(
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

// --- Unified HTTP Server ---
const httpServer = createServer(app);
const apiServer = httpServer.listen(config.api.port, () => {
  console.log(`🛠 Express server listening on port ${config.api.port}`);
});

// --- MQTT Bridge ---
const mqttHandler = createMQTTHandler('mqtt-bridge', {
  brokerUrl: config.mqtt.brokerUrl,
  subTopic: config.mqtt.subTopic,
  pubOptions: config.mqtt.pubOptions
});
mqttHandler.connect();


// --- Graceful Shutdown ---
['SIGINT', 'SIGTERM'].forEach(sig => {
  process.on(sig, () => {
    console.log(`🔻 Received ${sig}, shutting down...`);
    ingestionHandler.stop();
    mqttHandler.disconnect?.();
    apiServer.close(() => console.log('🛑 HTTP server closed'));
    shutdown(sig);
  });
});
