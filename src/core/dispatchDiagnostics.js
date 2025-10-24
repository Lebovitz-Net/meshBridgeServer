import { insertHandlers } from '../db/insertHandlers.js';
import { emitOverlay } from '../overlays/overlayEmitter.js';
import { emitEvent } from '../events/eventEmitter.js';
import { decodeNodeInfo } from '../utils/stringUtils.js';

const logRecordMessage  = (data, meta) => {
        const { connId, fromNodeNum, toNodeNum, timestamp } = meta;

        insertHandlers.insertLogRecord({ 
            message: data.message ?? null,
            time: data.time ?? null,
            fromNodeNum,
            toNodeNum,
            timestamp,
            connId,
        });

}

export const dispatchDiagnostics = {
    LogRecord: (subPacket) => {
        const { data, meta } = subPacket;

        console.log('.../LogRecord ', subPacket, decodeNodeInfo(data.message));
        logRecordMessage(data, meta);
        emitOverlay('LogMessage', subPacket);
    },

    // FromRadio oneofs
    logRecord: (subPacket) => {
        const { data, meta } = subPacket;

        console.log('.../logRecord ', subPacket);
        logRecordMessage(data, meta);
        emitOverlay('logMessage', subPacket);
    },
}
