// nodeMapping.js (or a dedicated mapping module)

const ipToDeviceMap = new Map();
const channelToNum = new Array();

// Pending resolvers keyed by sourceIp

export function setMapping(sourceIp, num, key) {
  if (!sourceIp || !num) return;
  ipToDeviceMap.set(sourceIp, { num, key });
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
