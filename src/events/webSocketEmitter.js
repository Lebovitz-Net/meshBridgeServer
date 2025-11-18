// File: bridge/utils/websocketEmitter.js

const clients = new Set();

export function registerClient(ws) {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
}

export function emit(eventType, payload) {
  const message = JSON.stringify({ type: eventType, ...payload });
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  }
}

export function shutdown() {
  for (const ws of clients) {
    ws.close();
  }
}
