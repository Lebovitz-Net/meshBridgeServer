import WebSocket from 'ws';

const WS_URL = 'ws://localhost:8080'; // Update to match your server

const testGetNodes = () => {
  const socket = new WebSocket(WS_URL);

  socket.on('open', () => {
    console.log('[WS] Connected to server');
    socket.send(JSON.stringify({ type: 'getNodes' }));
  });

  socket.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'nodeList') {
        console.log('[WS] Received node list:');
        for (const node of msg.nodes) {
          console.log(`- ${node.num}: ${node.label}`);
        }
        socket.close();
      } else {
        console.log('[WS] Unexpected message:', msg);
      }
    } catch (err) {
      console.error('[WS] Failed to parse message:', err);
    }
  });

  socket.on('error', (err) => {
    console.error('[WS] Connection error:', err);
  });

  socket.on('close', () => {
    console.log('[WS] Connection closed');
  });
};

testGetNodes();
