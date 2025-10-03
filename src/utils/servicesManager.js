// serviceManager.js
// Manages lifecycle of backend services: shutdown and restart.
// Used by signal handlers and API endpoints.

import queryHandlers from '../db/queryHandlers.js';
const { getFullConfig } = queryHandlers;

// --- Teardown ---
export const teardownServices = async () => {
  console.log('⚠️  Tearing down services...');

  if (global.mesh?.end) {
    console.log('Closing Mesh TCP connection...');
    global.mesh.end();
  }

  if (global.mqttHandler?.disconnect) {
    console.log('Disconnecting MQTT...');
    global.mqttHandler.disconnect();
  }

  if (global.tcpServer?.close) {
    console.log('Closing TCP server...');
    global.tcpServer.close();
  }

  if (global.wsServer?.close) {
    console.log('Closing WebSocket server...');
    global.wsServer.close();
  }

  if (global.apiServer?.close) {
    console.log('Closing API server...');
    await new Promise(resolve => global.apiServer.close(resolve));
  }

  console.log('✅ Teardown complete.');
};

// --- Init ---
export const initServices = (config) => {
  console.log('🚀 Initializing backend services...');

  // Replace these with your actual service initializers
  global.tcpServer = startTcpServer(config);
  global.wsServer = startWsServer(config);
  global.mqttHandler = connectMqtt(config);
  global.mesh = openMeshSocket(config);
  startIngestionLoop(config);

  console.log('✅ All services initialized.');
};

// --- Shutdown ---
export const shutdown = async (signal = 'manual') => {
  console.log(`\n⚠️  Received ${signal}, shutting down gracefully...`);
  await teardownServices();
};

// --- Restart ---
export const restartServices = async () => {
  console.log('🔄 Restarting backend services...');
  await teardownServices();
  await new Promise(resolve => setTimeout(resolve, 1000));
  const config = getFullConfig();
  initServices(config);
  console.log('✅ Restart complete.');
  return { restarted: true, timestamp: Date.now() };
};
