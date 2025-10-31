import { insertHandlers } from '../../db/insertHandlers.js';
import { emitOverlay } from '../../overlays/overlayEmitter.js';
import { emitEvent } from '../../events/eventEmitter.js';
import { getPortName } from '../utils/portnumUtils.js';
import { decompress } from '../packets/decompress.js';
import { parsePlainMessage, getBaseMeta, getChannel } from '../packets/packetUtils.js';
import { tryDecodeBuf } from '../packets/packetDecode.js';
import { dispatchPacket } from './dispatchPacket.js';

function processMeshPacket(packet) {
    const data = packet?.data;

    const portnum = data?.decoded?.portnum;
    const payload = data?.decoded?.payload;

    if (!portnum || !payload) return null;

    const extractOptions = (packet) => {
    const msg = packet.decode;

        return {
        "wantAck": msg?.wantAck || 0,
        "wantReply": msg?.wantResponse || 0,
        "replyId": msg?.replyId || 0
        }
    }

    switch (getPortName(portnum)) {
        case 'TEXT_MESSAGE_APP': { // Plain text message

            const message = parsePlainMessage(payload);
            if ( message ) {
                dispatchPacket({ type: 'message', packet, meta: { ...getBaseMeta(data) } })
            }
            break;
        }

        case 'TEXT_MESSAGE_COMPRESSED_APP': { // Compressed message

            try {
                const decompressed = decompress(payload);
                if (!decompressed) return null;
                const message = parsePlainMessage(decompressed);
                if (message) {
                   dispatchPacket({ type: 'message', data: { packet, ...extractOptions(packet)  }, meta: { ...getBaseMeta(data) } })
                }
            } catch (err) {
                console.warn('[dispatchMeshPacket] Port 7 decompression failed:', err);
                return null;
            }
            break;
        }

        case 'POSITION_APP': { // Position
                const position = tryDecodeBuf(payload, 'Position');
                if (position) { dispatchPacket({
                    type: 'position',
                    data: {
                        latitude: position.latitudeI / 1e7,
                        longitude: position.longitudeI / 1e7,
                        altitude: position.altitude ?? null,
                        batteryLevel: position.batteryLevel ?? null,
                        toNodeNum: getBaseMeta(data).toNodeNum,
                        fromNodeNum: getBaseMeta(data).fromNodeNum,
                    },
                    meta: getBaseMeta(data),
                })} else { console.warn('[dispatchMeshPacket] cannot decode Position')};
            break;
        }

        case 'NODEINFO_APP': { // NodeInfo
                const user = tryDecodeBuf(payload, 'User')
                if (user) { dispatchPacket ({
                    type: 'nodeInfo',
                    data: {
                        id: user.id,
                        longName: user.longName,
                        shortName: user.shortName,
                        hwModel: user.hwModel,
                    },
                    meta: getBaseMeta(data),
                })} else console.warn('[dispatchMeshPacket] Failed to decode NodeInfo:');

            break;
        }

        case 'ROUTING_APP': { // Routining (placeholder)
        dispatchPacket ({ type: 'routingMessage', data: { ignored: true }, meta: getBaseMeta(data) });
        break;
        }

        case 'ADMIN_APP': {
        dispatchPacket ({ type: "adminMessage", data: { ignored: true }, meta: getBaseMeta(data) })
        break;
        }

        case 'TELEMETRY_APP': { // Telemetry
            const telemetry = tryDecodeBuf(payload, 'Telemetry');
            if (telemetry) { dispatchPacket ({
                type: 'telemetry',
                data: {
                    voltage: telemetry.voltage,
                    channelUtilization: telemetry.channelUtilization,
                    airUtilTx: telemetry.airUtilTx,
                },
                meta: { ...getBaseMeta(data) }
            })} else console.warn('[dispatchMeshPacket] Failed to decode Telemetry:');
            break;
        }

        default: {
            console.warn(`[dispatchMeshPacket] Unknown port ${portnum} on channel ${getChannel(packet)}, skipping`);
            break;
        }
    }
};

export const dispatchMeshPacket = {

    MeshPacket: processMeshPacket,
    packet: processMeshPacket,
    Data: (packet) => {    
      const subPacket =  packet.data;
    },
    decoded: (packet) => {
    }

};

