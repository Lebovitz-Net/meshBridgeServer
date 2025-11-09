import { insertLogRecord } from "../../db/inserts/diagnosticInserts.js";

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
        console.log(`.../dispatchDiagnostics LogRxData`);
    },
}