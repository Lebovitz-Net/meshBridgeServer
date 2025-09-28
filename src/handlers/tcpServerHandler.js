// bridge/tcpServerHandler.js
import net from 'net';
import { extractFrames } from '../core/frameParser.js';
import { config } from '../config/config.js';

export default function createTCPServer(name, host, port, handlers = {}) {
  const {
    onConnect = () => {},
    onFrame = () => {},
    onError = () => {},
    onClose = () => {}
  } = handlers;

  const server = net.createServer((socket) => {
    const connId = `${name}-${Date.now()}`;
    let buffer = Buffer.alloc(0);

    const meta = {
      connId,
      sourceIp: socket.remoteAddress,
      sourcePort: socket.remotePort,
      transport: 'tcp-server',
      serverName: name,
      host,
      port
    };

    onConnect(meta);

    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      const { frames, remainder } = extractFrames(buffer);
      buffer = remainder;
      frames.forEach((frame) => onFrame(meta, frame));
    });

    socket.on('error', (err) => onError(meta, err));
    socket.on('close', () => onClose(meta));
  });

  server.listen(config.tcp.port, host, () => {
    console.log(`[tcp-bridge] Listening on ${host}:${config.tcp.port}`);
  });

  return server;
}
