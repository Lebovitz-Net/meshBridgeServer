// main.js
import { startServer } from './servers/server.js';

try {
  await startServer();
} catch (err) {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
}
