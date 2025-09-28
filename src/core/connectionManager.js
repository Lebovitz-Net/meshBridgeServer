// --- In-memory cache: source_ip -> { num, device_id }
const ipToDeviceMap = new Map();

/**
 * set mapping between sourceIp, num, and device_id.
 * Updates the in-memory cache (for fast lookups).
 */
export function setMapping(sourceIp, num, device_id) {
  if (!sourceIp || !num) return;
  ipToDeviceMap.set(sourceIp, { num, device_id });
}

/**
 * Resolve mapping from in-memory cache.
 */
export function getMapping(sourceIp) {
  return ipToDeviceMap.get(sourceIp) || null;
}