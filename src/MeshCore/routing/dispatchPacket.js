import { dispatchMessages } from './dispatchMessages.js';
import { dispatchConfigs } from './dispatchConfigs.js';
import { dispatchNodes } from './dispatchNodes.js';
import { dispatchMetrics } from './dispatchMetrics.js';
import { dispatchChannels } from './dispatchChannels.js';
import { dispatchMeshPacket } from './dispatchMeshPacket.js';
import { dispatchMqtt } from './dispatchMqtt.js';
import { dispatchDiagnostics } from './dispatchDiagnostics.js';
import Constants from '../../../external/meshcore.js/src/constants.js';
import { TypeFormatFlags } from 'typescript';


const responseCodes = Constants.ResponseCodes;
const pushCodes = Constants.PushCodes;
const allCodes = { ...responseCodes, ...pushCodes };
const responseMap = new Map(
  Object.entries(allCodes).map(([key, value]) => [value, key])
);

export const getEventName = (num) => {
   return responseMap.get(num);
}

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
  const {type, data, meta} = subPacket;
  const key = getEventName(type);
  const handler = dispatchRegistry[key];
  if (handler) {
    handler(subPacket);
  } else {
    console.warn(`[dispatchpacket] No handler for type ${key}`);
  }
}
