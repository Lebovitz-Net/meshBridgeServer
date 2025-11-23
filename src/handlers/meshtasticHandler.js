// src/handlers/meshHandler.js
import TcpConnection from '../Meshtastic/TcpConnection.js';
import SerialConnection from '../Meshtastic/SerialConnection.js';

export default async function createMeshHandler(connId, host, port, opts = {}) {
  const {
    reconnect = { enabled: true },
    getConfigOnConnect = false
  } = opts;

  // Just create an EventEmitter directly

  const connection =  new TcpConnection({
    connId,
    host,
    port,
    reconnectPolicy: reconnect.enabled,
  });

  
    // Instantiate transports
    // this need to be integrated with the current TcpCOnnection
    const tcpConn = new TcpConnection({ connId, host, port });
    const serialConn = new SerialConnection({ devicePath: '/dev/ttyUSB0', baudRate: 115200, connId: 'serial-1' });
  
    // Subscribe router to packet events
    [tcpConn, serialConn].forEach(conn => {
      conn.on('packet', (meta, buffer) => {
        routePacket(meta, buffer);
      });
      conn.on('connect', (meta) => console.log(`[Bridge] Connected:`, meta));
      conn.on('error', (meta, err) => console.error(`[Bridge] Error:`, meta, err));
    });

  return {
    send: (packet) => {
      if (Buffer.isBuffer(packet)) {
        connection.write(packet);
      } else {
        throw new Error("[meshtasticHandler] send packet must be a buffer");
      }
    },
    end: connection.stop,
    on: connection.on.bind(connection),
    off: connection.off.bind(connection)
  };
}
