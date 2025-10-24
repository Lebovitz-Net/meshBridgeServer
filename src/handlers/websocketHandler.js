// File: ../handlers/websocketHandler.js

import { registerClient } from '../utils/websocketEmitter.js';

export default function websocketHandler(ws, req) {
  registerClient(ws);

  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to meshmanager WebSocket transport'
  }));

  ws.on('message', (msg) => {
    // Optional: handle client → server messages here
    // e.g. client subscriptions, pings, or diagnostics
  });
}
