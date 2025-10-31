// src/MeshCore/meshcoreStartup.js
import createMeshcoreHandler from '../handlers/meshcoreHandler.js';
import { bindMeshRuntime as bindMeshcoreRequests } from '../handlers/meshcoreRequests.js';
import { registerMeshRuntime, subscribeToPackets } from '../core/meshGateway.js';
import { ingest as meshcoreIngest } from '../MeshCore/meshcoreIngestionHandler.js';
import Constants from '../../external/meshcore.js/src/constants.js';

function startAdvertLoop(tcp, role = 0, intervalMs = 60000) {
  const interval = setInterval(() => {
    try {
      tcp.sendCommandSendSelfAdvert(role);
      console.log(`[${new Date().toISOString()}] Sent self advert as ${role}`);
    } catch (err) {
      console.error('Failed to send advert:', err);
    }
  }, intervalMs);

  return interval; // so you can clear it later
}


export async function startMeshcore() {
  const host = process.env.MESHCORE_HOST || '192.168.2.79';
  const port = process.env.MESHCORE_PORT || 5000;

  const meshcore = await createMeshcoreHandler(
    'meshcore-1',
    host,
    port,
    {
      getConfigOnConnect: false, // we’ll handle init explicitly
      reconnect: { enabled: true }
    }
  );

  // Bind request helpers
  bindMeshcoreRequests(meshcore);

  // Register runtime with gateway
  registerMeshRuntime('meshcore-1', 'meshcore', meshcore);
  // subscribeToPackets('meshcore-1', (data) => {
  //   meshcoreIngest(data);
  // });

  // --- Startup sequence --
  let interval = null;
  try {
    // Step 1: tell device to start app
    console.log('here step 1');

    await meshcore.tcp.sendCommandAppStart();
    await meshcore.awaitConnected(10000);
    await meshcore.tcp.setAdvertName('KD1MU');
    await meshcore.tcp.setAdvertLatLong(42345096,-71121411);
    await meshcore.tcp.setRadioParams(910525, 250000, 10, 5);
    await meshcore.tcp.getSelfInfo();
    interval = startAdvertLoop(meshcore.tcp);

    console.log('[meshcore-1] Startup sequence complete');
  } catch (err) {
    console.error('[meshcore-1] Startup sequence failed:', err);
  }

  return { meshcore, interval };
}
