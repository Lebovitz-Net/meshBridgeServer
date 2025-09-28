import { dispatchRegistry } from './dispatchRegistry.js';

export function dispatchSubPacket(subPacket) {
  if (!subPacket) return;

  const handler = dispatchRegistry[subPacket.type];
  if (handler) {
    handler(subPacket);
  } else {
    console.warn(`[dispatchSubPacket] No handler for type ${subPacket.type}`);
  }
}