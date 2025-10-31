// src/Meshtastic/meshtasticStartup.js
import createMeshHandler from '../handlers/meshtasticHandler.js';
import { bindMeshRuntime as bindMeshRequests } from '../handlers/meshtasticRequests.js';
import { registerMeshRuntime, subscribeToPackets } from '../core/meshGateway.js';
import { ingest as meshtasticIngest } from '../Meshtastic/meshtasticIngestionHandler.js';
import { buildToRadioFrame } from '../Meshtastic/packets/packetBuilder.js';
import { waitForMapping } from '../Meshtastic/routing/nodeMapping.js';

export async function startMeshtastic() {
  const host = process.env.NODE_IP_HOST || '192.168.1.52';
  const port = process.env.NODE_IP_PORT || 4403;

  const mesh = await createMeshHandler(
    'mesh-1',
    host,
    port,
    {
      reconnect: { enabled: true },
      getConfigOnConnect: false // we’ll handle init explicitly here
    }
  );

  // Bind request helpers
  bindMeshRequests(mesh);

  // Register runtime with gateway
  registerMeshRuntime('mesh-1', 'meshtastic', mesh);
  subscribeToPackets('mesh-1', (meta, buffer) => {
    meshtasticIngest(meta, buffer);
  });

  // --- Startup sequence ---
  try {
    // Send wantConfigId
    mesh.send(buildToRadioFrame('wantConfigId', 0));

    // Wait for mapping to be populated for this host
    const mapping = await waitForMapping(host, { timeout: 5000 });
    console.log(`[mesh-1] Startup sequence complete, mapping ready:`, mapping);
  } catch (err) {
    console.error('[mesh-1] Startup sequence failed:', err);
  }

  return mesh;
}
