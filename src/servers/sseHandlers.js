// import { broadcastEvent } from './sse.js';

// meshEmitter.on('packet', (packet) => {
//   broadcastEvent({ type: 'packet', packet });
// });

// meshEmitter.on('status', (status) => {
//   broadcastEvent({ type: 'status', status });
// });

const sseClients = new Set();

export const sseHandler = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173'); // 🔥 Required for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.flushHeaders(); // 🚀 Start streaming

    // Optional: send a heartbeat
    res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`);
    sseClients.add(res);

    // Store client connection if needed
    // clients.push(res);
  };

  export function shutdown() {
    for (const res of sseClients) {
      res.end();
    }
    sseClients.clear();
  }
  