import { insertHandlers } from '../db/insertHandlers.js';
import { emitOverlay } from '../overlays/overlayEmitter.js';
import { emitEvent } from '../events/eventEmitter.js';
import { decodePythonString } from '../utils/stringUtils.js';

export const dispatchMetrics = {

    queueStatus: (subPacket) => {
        const { data, meta } = subPacket;
        const { fromNodeNum, timestamp, device_id } = meta;
        const { queueStatus, connId } = data;

        insertHandlers.insertQueueStatus({
        num: fromNodeNum,
        device_id,
        res: queueStatus.res ?? null,
        free: queueStatus.free ?? null,
        maxlen: queueStatus.maxlen ?? null,
        meshPacketId: queueStatus.meshPacketId || null,
        connId,
        timestamp,
        });
    },

    telemetry: (subPacket) => {
      const { data, fromNodeNum, toNodeNum, connId, timestamp } = subPacket;
  
      insertHandlers.insertMetricsHandler({
        fromNodeNum,
        toNodeNum,
        conn_id: connId,
        timestamp,
        ...data,
      });
  
      emitOverlay('telemetry', subPacket);
    },

    HostMetrics: (subPacket) => {
      console.log('[dispatchMetrics] HostMetrics');
    },
};
