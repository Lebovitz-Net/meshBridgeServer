// src/MeshCore/meshcoreStartup.js
import MeshcoreHandler from '../handlers/meshcoreHandler.js';
import { bindMeshRuntime as bindMeshcoreRequests } from '../handlers/meshcoreRequests.js';
import { registerMeshRuntime } from '../core/meshGateway.js';
import { v4 as uuidv4 } from 'uuid';

export async function startMeshcore() {
  const host = process.env.MESHCORE_HOST || '192.168.2.79';
  const port = process.env.MESHCORE_PORT || 5000;
  const meshParams = { connId: uuidv4(), host, port };
  const meshOpts = {
      getConfigOnConnect: false, // we’ll handle init explicitly
      reconnect: { enabled: true }
    }

  const meshcore = new MeshcoreHandler(meshParams, meshOpts);
  const request = meshcore.request;

  // Bind request helpers
  bindMeshcoreRequests(meshcore);

  // Register runtime with gateway
  registerMeshRuntime('meshcore-1', 'meshcore', meshcore);

  // --- Startup sequence --
  let interval = null;
  try {
    await meshcore.connect(20000);
    await request.getSelfInfo();
    console.log('[meshcore-1] Connection complete');
  } catch (err) { console.error('[meshcore-1] Connection failed:', err); }

  await request.setRadioParams(910525, 62000, 7, 5) ;
  await request.setAdvertName('KD1MU') ;
  await request.setAdvertLatLong(42345096,-71121411) ;
  await request.getChannels();
  await request.getContacts();
  await request.getWaitingMessages();
  // await meshcore.request.sendChannelTextMessage(0, "Our Boston Area GMRS Club has a number of meshcore enthusiasts. All of use switched from Meshtastic.");
    // await meshcore.request.getNeighbours(bos4_repeaterPubKey) ;


  request.startLoop('advert', () => request.sendFloodAdvert(), 3600000);
  await request.getSelfInfo();

  console.log("meshcore startup complete");
  return { meshcore, request, stoploop: () => request.stopLoop('advert') };
}
