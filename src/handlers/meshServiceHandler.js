// File: services/meshService.js

import createMeshHandler from '../handlers/meshHandler.js';
import { routePacket } from '../core/ingestionRouter.js';

let meshInstance = null;

const createMeshService = (connId, host, port, opts = {}) => {
  meshInstance = createMeshHandler(connId, host, port, opts);
  return meshInstance;
};

export const sendToMeshNode = async (packet) => {
  if (!meshInstance) {
    throw new Error('Mesh handler not initialized');
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
