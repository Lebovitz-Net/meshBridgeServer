import express from 'express';
import { createServer } from 'http';
import { config } from '../config/config.js';
import runtimeConfigRoutes from '../routes/runtimeConfigRoutes.js';
import createMQTTHandler from '../handlers/mqttHandler.js';
import ingestionRouter from '../core/routePacket.js';
import ingestionHandler from '../handlers/ingestionHandler.js';
import { registerRoutes } from '../api/routes.js';
import createMeshService from '../handlers/meshServiceHandler.js';
import { initProtoTypes } from '../utils/protoUtils.js';
import { shutdown } from '../utils/servicesManager.js';
import cors from 'cors';
import { sseRouter } from './sse.js';
import websocketHandler from '../handlers/websocketHandler.js';
import { WebSocketServer } from 'ws';
import { sseHandler } from './sseHandlers.js';

export async function startServer() {
  await initProtoTypes(); // sets up decode + encode logic
  // --- Express API ---
  const app = express();
  app.use(cors({
    origin: 'http://localhost:5173', // or use '*' for dev
    methods: ['GET', 'POST'],
    credentials: true
  }));

  app.use(express.json());
  app.use('/sse', sseRouter);
  app.use('/api/v1/config', runtimeConfigRoutes);
  app.get('/', (req, res) => res.send('MeshManager v2 is running'));
  app.get('/sse/events', sseHandler);

  registerRoutes(app);

  // --- Unified HTTP Server ---
  const httpServer = createServer(app);
  const apiServer = httpServer.listen(config.api.port, () => {
    console.log(`🛠 Express server listening on port ${config.api.port}`);
  });
  
  const wss = new WebSocketServer({ server: httpServer });
  wss.on('connection', websocketHandler);


  // --- Mesh connection (outbound TCP client) ---
  const mesh = await createMeshService(
    'mesh-1',
    process.env.NODE_IP_HOST || '192.168.1.52',
    process.env.NODE_IP_PORT || 4403,
    ingestionRouter.routePacket
  );

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
}