import { dispatchMessages } from './dispatchMessages.js';
import { dispatchConfigs } from './dispatchConfigs.js';
import { dispatchNodes } from './dispatchNodes.js';
import { dispatchMetrics } from './dispatchMetrics.js';
import { dispatchChannels } from './dispatchChannels.js';
import { dispatchMeshPacket } from './dispatchMeshPacket.js';
import { dispatchMqtt } from './dispatchMqtt.js';
import { dispatchDiagnostics } from './dispatchDiagnostics.js';

const dispatchRegistry = {
  ...dispatchMeshPacket,
  ...dispatchMessages,
  ...dispatchConfigs,
  ...dispatchNodes,
  ...dispatchMetrics,
  ...dispatchChannels,
  ...dispatchMqtt,
  ...dispatchDiagnostics,
  default: (subPacket) => {
    console.log('[dispatchRegister] no such packet type', subPacket.type);
  } 
};

// Combine all dispatchers into a single registry

export function dispatchPacket(subPacket) {
  if (!subPacket) return;

  const handler = dispatchRegistry[subPacket.type];
  if (handler) {
    handler(subPacket);
  } else {
    console.warn(`[dispatchpacket] No handler for type ${subPacket.type}`);
  }
}
