// connectionManager.js (or a dedicated mapping module)

const ipToDeviceMap = new Map();
const channelToNum = new Array();

// Pending resolvers keyed by sourceIp
const mappingWaiters = new Map();

export function setMapping(sourceIp, num, device_id) {
  if (!sourceIp || !num) return;
  ipToDeviceMap.set(sourceIp, { num, device_id });

  // ✅ resolve any pending waiters
  if (mappingWaiters.has(sourceIp)) {
    mappingWaiters.get(sourceIp).forEach(resolve => resolve({ num, device_id }));
    mappingWaiters.delete(sourceIp);
  }
}

export function setChannelMapping(channelId, num) {
  if (channelId == null || !num) return;
  channelToNum[channelId] = num;
}

export function getMapping(sourceIp) {
  return ipToDeviceMap.get(sourceIp) || null;
}

export function getChannelMapping(channelId) {
  return channelToNum[channelId];
}

// --- New: awaitable mapping
export function waitForMapping(sourceIp, { timeout = 5000 } = {}) {
  return new Promise((resolve, reject) => {
    // If mapping already exists, resolve immediately
    const existing = ipToDeviceMap.get(sourceIp);
    if (existing) return resolve(existing);

    // Otherwise, queue a resolver
    if (!mappingWaiters.has(sourceIp)) {
      mappingWaiters.set(sourceIp, []);
    }
    mappingWaiters.get(sourceIp).push(resolve);

    // Timeout guard
    if (timeout) {
      setTimeout(() => {
        reject(new Error(`Timeout waiting for mapping of ${sourceIp}`));
      }, timeout);
    }
  });
}
