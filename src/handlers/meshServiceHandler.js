// File: services/meshService.js

import createMeshHandler from '../handlers/meshHandler.js';
import { routePacket } from '../core/routePacket.js';

let meshInstance = null;

const createMeshService = async (connId, host, port, opts = {}) => {
  meshInstance = await createMeshHandler(connId, host, port, opts);
  return meshInstance;
};

export const sendToMeshNode = async (packet) => {
  if (!meshInstance) {
    throw new Error('Mesh handler not initialized');
  }
  
if (typeof meshInstance?.then === 'function') {
  console.warn('meshInstance is a Promise—resolving now');
  meshInstance = await meshInstance;
}

  meshInstance.write(packet); // uses ingestionHandler.write(frame)

  return {
      session_id: meshInstance.sessionId || 'mesh-1', // or connId from ingestionHandler
      timestamp: new Date().toISOString()
  };
};

function generateMessageId() {
  return Math.floor(Math.random() * 1e6).toString();
}

export default createMeshService;
