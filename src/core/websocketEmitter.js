// core/websocketEmitter.js
import { getActiveSessions } from './sessionRegistry.js';

export const sendWSBroadcast = (transportType, packet) => {
  if (typeof packet !== 'object') return;

  for (const [sessionId, { ws }] of getActiveSessions().entries()) {
    if (ws.readyState === ws.OPEN) {
      try {
        const enriched = { ...packet, transportType };
        ws.send(JSON.stringify(enriched));
      } catch (err) {
        console.error(`[WS] Send error to ${sessionId}:`, err.message);
      }
    }
  }
};

export const sendToSession = (sessionId, packet) => {
  const session = getActiveSessions().get(sessionId);
  if (!session?.ws || session.ws.readyState !== session.ws.OPEN) return;
  try {
    session.ws.send(JSON.stringify(packet));
    console.log(`[WS] Sent to session ${sessionId}`);
  } catch (err) {
    console.error(`[WS] Send error to ${sessionId}:`, err.message);
  }
};
