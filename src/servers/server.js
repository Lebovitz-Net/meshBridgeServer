// server.js

import express from 'express';
import { createServer } from 'http';
import { config } from '../config/config.js';
import cors from 'cors';
import { WebSocketServer } from 'ws';

import runtimeConfigRoutes from '../api/runtimeConfigRoutes.js';
import { initProtoTypes } from '../Meshtastic/utils/protoUtils.js';
import { shutdown } from '../api/servicesManager.js';
import { registerRoutes } from '../api/routes.js';
import { sseRouter } from './sse.js';
import { sseHandler } from './sseHandlers.js';
import websocketHandler from '../handlers/websocketHandler.js';
import { startMeshtastic } from './meshtasticStartup.js';
import { startMeshcore } from './meshcoreStartup.js';
import { startMqttServer } from './mqttStartup.js';

export async function startServer() {
  // --- Initialize protobufs for Meshtastic ---
  await initProtoTypes();

  // --- Express API ---
  const app = express();
  app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }));
  app.use(express.json());

  // Routes
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

  // --- WebSocket Server ---
  const wss = new WebSocketServer({ server: httpServer });
  wss.on('connection', websocketHandler);

  // --- Start runtimes ---
  //const mesh = await startMeshtastic();   // Meshtastic runtime (with startup handshake)
  const { meshcore, interval } = await startMeshcore(); // MeshCore runtime (placeholder handshake for now)
  //const mqttHandler = await startMqttServer();

  // --- Graceful Shutdown ---
  ['SIGINT', 'SIGTERM'].forEach(sig => {
    process.on(sig, () => {
      console.log(`🔻 Received ${sig}, shutting down...`);

      // Disconnect MQTT
      mqttHandler.disconnect?.();

      // End runtimes
      meshcore?.tcp.close();
      mesh?.end?.();

      // Close HTTP server
      apiServer.close(() => console.log('🛑 HTTP server closed'));
      if (stoploop) stoploop();
      // Run any service shutdown hooks
      shutdown(sig);
    });
  });
}
