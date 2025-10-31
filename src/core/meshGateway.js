// meshGateway.js
import { meshRequests } from '../handlers/meshtasticRequests.js';
import { meshcoreRequests } from '../handlers/meshcoreRequests.js';

// connId → { type, handler }
const runtimes = new Map();

let dryRun = false;

/**
 * Enable/disable dry-run mode (logs packets instead of sending)
 */
export function setDryRunMode(enabled) {
  dryRun = enabled;
}

/**
 * Register a mesh runtime (Meshtastic or MeshCore)
 * @param {string} connId - Unique connection ID
 * @param {'meshtastic'|'meshcore'} type - Protocol type
 * @param {object} handler - Runtime with .send(packet) and .on(event, callback)
 */
export function registerMeshRuntime(connId, type, handler) {
  runtimes.set(connId, { type, handler });
  logBridgeEvent('register', connId, type, { status: 'ok' });
}

/**
 * Dispatch a request to the correct runtime
 * @param {string} connId - Target connection ID
 * @param {string} requestType - Request name (e.g. 'sendMessage')
 * @param {object} payload - Request payload
 */
export async function dispatchRequest(connId, requestType, payload) {
  const runtime = runtimes.get(connId);
  if (!runtime) throw new Error(`No runtime registered for ${connId}`);

  const { type, handler } = runtime;
  const registry = type === 'meshcore' ? meshcoreRequests : meshRequests;
  const builder = registry[requestType];
  if (!builder) throw new Error(`Unknown request type: ${requestType}`);

  const packet = builder(payload);

  if (dryRun) {
    logBridgeEvent('dry-run', connId, type, { requestType, packet });
    return packet;
  }

  logBridgeEvent('out', connId, type, { requestType, packet });
  handler.send(packet);
  return packet;
}

/**
 * Subscribe to inbound packets from a runtime
 * @param {string} connId - Target connection ID
 * @param {(bridgePacket: object) => void} callback - Handler for normalized packets
 */
export function subscribeToPackets(connId, callback) {
  const runtime = runtimes.get(connId);
  if (!runtime) throw new Error(`No runtime registered for ${connId}`);
  const { type, handler } = runtime;

  handler.on?.('packet', (data) => {
    logBridgeEvent('in', connId, type, { packet: data });
    callback(data);
  });
}

/**
 * Internal diagnostic logger
 */
function logBridgeEvent(direction, connId, source, detail) {
  const ts = new Date().toISOString();
  // console.log(`[bridge] ${ts} ${direction} conn=${connId} source=${source}`, detail);
}
