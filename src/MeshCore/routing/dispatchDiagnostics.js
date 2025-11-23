import { insertHandlers } from '../../db/insertHandlers.js';
const { insertLogRecord, insertTraceData } = insertHandlers;

export const dispatchDiagnostics = {
    LogRxData: (packet) => {
        const { data, meta } = packet.data;
        const shaped = {
            fromNodeNum: 0,
            decodeType: 0,
            message: JSON.stringify(packet.data?.data),
            timestamp: meta.timestamp,
            connId: meta.connId
        }
        insertLogRecord(shaped);
    },

    TraceData: (packet) => {
        try {
        // packet is the TraceData object you showed earlier
        insertTraceData(packet);
        console.log('[dispatchDiagnostics] TraceData inserted:', packet.data.meta.connId);
        } catch (err) {
        console.error('[dispatchDiagnostics] Failed to insert TraceData:', err);
        }
    },
};
