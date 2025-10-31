import createTCPSocket from './tcpSocket.js';
import { currentIPHost, currentIPPort } from '../config/config.js';
import { scheduleReconnect } from './scheduleReconnect.js';
import { routePacket } from './packets/packetRouter.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Ingestion Router
 * - Manages TCP connection lifecycle (connect, error, close, reconnect).
 * - Delegates frame processing to a provided ingestion function.
 */
export default function createConnection({
  host = currentIPHost,
  port = currentIPPort,
  connId = uuidv4(),
  onConnect,
  onFrame,          // optional override
  onError,
  onClose,
  ingest,           // 👈 protocol-level ingestion function (e.g. meshtasticIngestionHandler.ingest)
  metaOverrides = {},
  reconnectPolicy = true
} = {}) {
  const tcpConnections = new Map();
  let isShuttingDown = false;

  const openConnection = (id) => {
    const tcp = createTCPSocket(id, host, port, {
      onConnect: (meta) => {
        onConnect?.(meta);
        console.log(`[TCP ${meta.connId}] Connected`);
      },
      onFrame: (meta, buffer) => {
        const enrichedMeta = { ...meta, ...metaOverrides, source: 'tcp' };
        routePacket(enrichedMeta, buffer);
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
    return tcp;
  };

  const start = async () => {
    const tcp = openConnection(connId);
    await tcp.connected;
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
