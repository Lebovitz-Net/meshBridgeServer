// handlers/websocketSessionHandler.js
import { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';
import createWebsocketHandler from './websocketHandler.js';
import { registerSession, unregisterSession } from '../core/sessionRegistry.js';

/**
 * Initializes the WebSocket server and manages session lifecycle.
 * @param {object} options - Configuration options
 * @param {number} options.port - Port to listen on
 */
export default function createWebsocketSessionHandler({ port = 8080 } = {}) {
  const wss = new WebSocketServer({ port });
  const handler = createWebsocketHandler();

  wss.on('connection', (ws, req) => {
    const sessionId = randomUUID();
    const ctx = {
      id: sessionId,
      ip: req.socket?.remoteAddress,
      ua: req.headers['user-agent'],
      connectedAt: Date.now()
    };

    registerSession(sessionId, { ws, meta: ctx });

    if (handler?.connect) {
      handler.connect(ws, ctx);
    }

    ws.on('close', () => {
      unregisterSession(sessionId);
      if (handler?.disconnect) {
        handler.disconnect(sessionId);
      }
    });
  });

  wss.on('listening', () => {
    console.log(`🌐 WebSocket server listening on port ${port}`);
  });

  wss.on('error', (err) => {
    console.error('[WebSocket] Server error:', err.message);
  });

  return wss;
}
