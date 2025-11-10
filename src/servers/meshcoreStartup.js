// src/MeshCore/meshcoreStartup.js
import createMeshcoreHandler from '../handlers/meshcoreHandler.js';
import { bindMeshRuntime as bindMeshcoreRequests } from '../handlers/meshcoreRequests.js';
import { registerMeshRuntime, subscribeToPackets } from '../core/meshGateway.js';
import { getHexKey, repeaterContacts } from '../MeshCore/repeaterContacts.js';
import { ingest as meshcoreIngest } from '../MeshCore/meshcoreIngestionHandler.js';
import Constants from '../../external/meshcore.js/src/constants.js';
import { MeshcoreCommandQueue } from '../MeshCore/meshcoreCommandQueue.js';
import { dispatchPacket } from '../MeshCore/routing/dispatchPacket.js';
import { dispatch } from '../MeshCore/packetRouter.js';

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
  const queue = new MeshcoreCommandQueue(meshcore, 10000); // 7s timeout

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
    await queue.send(() => meshcore.tcp.getSelfInfo());
    await queue.awaitConnected(20000);
    console.log('[meshcore-1] Startup sequence complete');
  } catch (err) { console.error('[meshcore-1] Startup sequence failed:', err); }

  await queue.send(() => meshcore.tcp.setRadioParams(910525, 62000, 7, 5) );
  await queue.send(() => meshcore.tcp.setAdvertName('KD1MU') );
  await queue.send(() => meshcore.tcp.setAdvertLatLong(42345096,-71121411) );
  await queue.send(() => meshcore.tcp.getWaitingMessages());

  // await queue.send(() => meshcore.tcp.sendChannelTextMessage(0, "yeah the connection seems pretty stable. I have the device and antenna on the GMRS repeater mast."));
    // await queue.send(() => meshcore.tcp.getNeighbours(bos4_repeaterPubKey) );
    // await queue.send(() => meshcore.tcp.tracePath([getHexKey('bos4')]) );

  queue.startLoop('advert', () => meshcore.tcp.sendFloodAdvert(), 3600000);
  await meshcore.tcp.getSelfInfo();

  console.log("meshcore startup complete");
  return { meshcore, stoploop: () => queue.stopLoop('advert') };
}
