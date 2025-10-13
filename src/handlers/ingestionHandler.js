// src/handlers/ingestionHandler.js
import createTCPHandler from './tcpHandler.js';
import { currentIPHost, currentIPPort } from '../config/config.js';
import { routePacket } from '../core/routePacket.js';
import { scheduleReconnect } from '../core/scheduleReconnect.js';
import { v4 as uuidv4 } from 'uuid';

export default function createIngestionHandler({
  host = currentIPHost,
  port = currentIPPort,
  connId = uuidv4(),
  onConnect,
  onFrame,
  onError,
  onClose,
  metaOverrides = {},
  reconnectPolicy = true
} = {}) {
  const tcpConnections = new Map();
  let isShuttingDown = false;

  const openTCPConnection = (id) => {
    const tcp = createTCPHandler(id, host, port, {
      onConnect: (meta) => {
        onConnect?.(meta);
        console.log(`[TCP ${meta.connId}] Connected`);
      },
      onFrame: (meta, buffer) => {
        const enrichedMeta = { ...meta, ...metaOverrides, source: 'tcp' };
        if (onFrame) {
          onFrame(enrichedMeta, buffer);
        } else {
          routePacket(buffer, enrichedMeta);
        }
      },
      onError: (meta, err) => {
        onError?.(meta, err);
        console.error(`[TCP ${meta.connId}] Error: ${err.message}`, err);
        if (reconnectPolicy && !isShuttingDown) {
          scheduleReconnect(meta.connId, host, port, tcpConnections, openTCPConnection);
        }
      },
      onClose: (meta) => {
        onClose?.(meta);
        console.warn(`[TCP ${meta.connId}] Closed`);
        if (reconnectPolicy && !isShuttingDown) {
          scheduleReconnect(meta.connId, host, port, tcpConnections, openTCPConnection);
        }
      },
      onTimeout: (meta) => {
        console.warn(`[TCP ${meta.connId}] Timeout`);
        if (reconnectPolicy && !isShuttingDown) {
          scheduleReconnect(meta.connId, host, port, tcpConnections, openTCPConnection);
        }
      },
      onEnd: (meta) => {
        console.warn(`[TCP ${meta.connId}] Remote end`);
        if (reconnectPolicy && !isShuttingDown) {
          scheduleReconnect(meta.connId, host, port, tcpConnections, openTCPConnection);
        }
      }
    });

    tcpConnections.set(id, { tcp, host, port, reconnectTimer: null });
    return tcp; // ✅ return handler so we can await tcp.connected
  };

  const start = async () => {
    const tcp = openTCPConnection(connId);
    await tcp.connected; // ⏳ wait until the socket is truly connected
    console.log(`[Ingest ${connId}] Startup complete`);
    return tcp;
  };

  const stop = () => {
    isShuttingDown = true;
    tcpConnections.forEach(({ tcp, reconnectTimer }) => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      tcp.end();
    });
    tcpConnections.clear();
  };

  const write = (buf) => {
    const entry = tcpConnections.get(connId);
    const tcp = entry?.tcp;
    if (!tcp || !tcp.write) return false;
    const ok = tcp.write(buf);
    if (!ok) console.warn(`[Ingest ${connId}] Write failed`);
    return ok;
  };

  return { start, stop, write };
}
