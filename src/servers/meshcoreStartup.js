// src/MeshCore/meshcoreStartup.js
import createMeshcoreHandler from '../handlers/meshcoreHandler.js';
import { bindMeshRuntime as bindMeshcoreRequests } from '../handlers/meshcoreRequests.js';
import { registerMeshRuntime } from '../core/meshGateway.js';

export async function startMeshcore() {
  const host = process.env.MESHCORE_HOST || '192.168.2.79';
  const port = process.env.MESHCORE_PORT || 5000;

  const meshcore = await createMeshcoreHandler(
    {
      connId: 'meshcore-1',
      host,
      port,
    },
    {
      getConfigOnConnect: false, // we’ll handle init explicitly
      reconnect: { enabled: true }
    }
  );
  const request = meshcore.request;

  // Bind request helpers
  bindMeshcoreRequests(meshcore);

  // Register runtime with gateway
  registerMeshRuntime('meshcore-1', 'meshcore', meshcore);

  // --- Startup sequence --
  let interval = null;
  try {
    await request.getSelfInfo();
    await meshcore.awaitConnected(20000);
    console.log('[meshcore-1] Startup sequence complete');
  } catch (err) { console.error('[meshcore-1] Startup sequence failed:', err); }

  await request.setRadioParams(910525, 62000, 7, 5) ;
  await request.setAdvertName('KD1MU') ;
  await request.setAdvertLatLong(42345096,-71121411) ;
  await request.getChannels();
  await request.getWaitingMessages();
  await request.getContacts();
  // await meshcore.request.sendChannelTextMessage(0, "Our Boston Area GMRS Club has a number of meshcore enthusiasts. All of use switched from Meshtastic.");
    // await meshcore.request.getNeighbours(bos4_repeaterPubKey) ;


  request.startLoop('advert', () => request.sendFloodAdvert(), 3600000);
  console.log(".../meshStartup getSelfInfo");
  await request.getSelfInfo();

  console.log("meshcore startup complete");
  return { meshcore, request, stoploop: () => request.stopLoop('advert') };
}
