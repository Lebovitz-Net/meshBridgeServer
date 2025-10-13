import net from 'net';
import { extractFrames } from '../core/frameParser.js';

/**
 * Creates a TCP handler instance for a given connection.
 * @param {string} connId - Unique ID for this TCP connection (assigned by WS handler)
 * @param {string} host - Target host
 * @param {number} port - Target port
 * @param {object} handlers - Event callbacks
 */
export default function createTCPHandler(connId, host, port, handlers = {}) {
  const {
    onConnect = () => {},
    onFrame = () => {},
    onError = () => {},
    onClose = () => {},
    onTimeout = () => {},
    onDrain = () => {},
    onEnd = () => {}
  } = handlers;

  const socket = new net.Socket();
  let buffer = Buffer.alloc(0);
  let connected = false;

  // Promise that resolves when socket connects
  const connectedPromise = new Promise((resolve, reject) => {
    socket.connect(port, host, () => {
      connected = true;

      const meta = {
        connId,
        sourceIp: socket.remoteAddress,
        sourcePort: socket.remotePort,
        transport: 'tcp',
        host,
        port
      };

      onConnect(meta);
      resolve(meta); // ✅ resolve when connected
    });

    socket.on('error', (err) => {
      connected = false;
      onError({ connId, sourceIp: socket.remoteAddress, transport: 'tcp' }, err);
      reject(err); // ❌ reject if connection fails
    });
  });

  // Frame parser
  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    const { frames, remainder } = extractFrames(buffer);
    buffer = remainder;

    frames.forEach((frame) => {
      try {
        const meta = {
          connId,
          sourceIp: socket.remoteAddress,
          sourcePort: socket.remotePort,
          transport: 'tcp',
          host,
          port,
          timestamp: Date.now(),
        };
        onFrame(meta, frame);
      } catch (err) {
        console.warn(`❌ [TCP ${connId}] Frame handler error:`, err);
      }
    });
  });

  // Lifecycle events
  socket.on('close', (hadError) => {
    connected = false;
    onClose({ connId, sourceIp: socket.remoteAddress, transport: 'tcp' }, hadError);
  });

  socket.on('timeout', () => {
    connected = false;
    onTimeout({ connId, sourceIp: socket.remoteAddress, transport: 'tcp' });
  });

  socket.on('drain', () => onDrain({ connId, sourceIp: socket.remoteAddress, transport: 'tcp' }));

  socket.on('end', () => {
    connected = false;
    onEnd({ connId, sourceIp: socket.remoteAddress, transport: 'tcp' });
  });

  return {
    connId,
    write: (data) => {
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
      if (!connected) {
        console.warn(`[TCP ${connId}] Write attempted with no active connection`);
        return false;
      }
      console.log(`[TCP ${connId}] SEND ${buf.length} bytes`, buf);
      const ok = socket.write(buf);
      if (!ok) console.warn(`[TCP ${connId}] Write buffer full`);
      return ok;
    },
    end: () => socket.end(),
    isConnected: () => connected,
    socket,
    connected: connectedPromise // ✅ expose for await
  };
}
