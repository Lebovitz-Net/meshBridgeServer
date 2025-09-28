// bridge/websocketHandler.js
import createTCPHandler from './tcpHandler.js';
import { currentIPHost, currentIPPort } from '../config/config.js';
import { routePacket } from '../core/ingestionRouter.js';
import { getActiveSessions, setActiveSessions } from '../core/sessionRegistry.js';
import { sendWSBroadcast } from '../core/websocketEmitter.js';
import { scheduleReconnect } from '../core/scheduleReconnect.js';
import { v4 as uuidv4 } from 'uuid';

export default function createWebsocketHandler() {
  const sessions = new Map();
  setActiveSessions(sessions);
  const connId = uuidv4();

  return {
    connect(ws, ctx) {
      const tcpConnections = new Map();
      sessions.set(ctx.id, { ws, tcpConnections });

      const openTCPConnection = (connId, host, port) => {
        sendWSBroadcast('channel_status', { connId, status: 'connecting' });

        const tcp = createTCPHandler(connId, host, port, {
          onConnect: (meta) => {
            sendWSBroadcast('channel_status', { connId: meta.connId, status: 'ready' });
          },
          onFrame: (meta, buffer) => {
            // Pass full meta to routePacket
            routePacket(buffer, {
              ...meta,
              source: 'websocket', // clarify source transport
              wsClientId: ctx.id
            });
          },
          onError: (meta, err) => {
            sendWSBroadcast('channel_status', { connId: meta.connId, status: 'error', detail: err.message });
            scheduleReconnect(meta.connId, host, port, tcpConnections, openTCPConnection);
          },
          onClose: (meta) => {
            sendWSBroadcast('channel_status', { connId: meta.connId, status: 'disconnected' });
            scheduleReconnect(meta.connId, host, port, tcpConnections, openTCPConnection);
          },
          onTimeout: (meta) => {
            sendWSBroadcast('channel_status', { connId: meta.connId, status: 'timeout' });
            scheduleReconnect(meta.connId, host, port, tcpConnections, openTCPConnection);
          },
          onEnd: (meta) => {
            sendWSBroadcast('channel_status', { connId: meta.connId, status: 'remote_end' });
            scheduleReconnect(meta.connId, host, port, tcpConnections, openTCPConnection);
          }
        });

        tcpConnections.set(connId, { tcp, host, port, reconnectTimer: null });
      };

      ws.on('message', (msg) => {
        try {
          const packet = JSON.parse(msg);
          const { transportType, connId, target } = packet;

          if (transportType === 'open_channel') {
            const id = connId || ctx.id;
            openTCPConnection(id, target?.host || currentIPHost, target?.port || currentIPPort);
            return;
          }

          if (transportType === 'close_channel' && tcpConnections.has(connId)) {
            tcpConnections.get(connId).tcp.end();
            tcpConnections.delete(connId);
            sendWSBroadcast('channel_status', { connId, status: 'closed' });
            return;
          }

          if (transportType === 'frame' && tcpConnections.has(connId)) {
            const payload = Object.values(packet);
            tcpConnections.get(connId).tcp.write(payload);
            return;
          }

        } catch (err) {
          console.error('Invalid WS message', err);
        }
      });

      ws.on('close', () => {
        tcpConnections.forEach(({ tcp, reconnectTimer }) => {
          if (reconnectTimer) clearTimeout(reconnectTimer);
          tcp.end();
        });
        tcpConnections.clear();
        sessions.delete(ctx.id);
        setActiveSessions(sessions);
      });
    }
  };
}
