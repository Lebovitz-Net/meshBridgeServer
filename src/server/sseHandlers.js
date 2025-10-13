js
import { broadcastEvent } from './sse.js';

meshEmitter.on('packet', (packet) => {
  broadcastEvent({ type: 'packet', packet });
});

meshEmitter.on('status', (status) => {
  broadcastEvent({ type: 'status', status });
});
