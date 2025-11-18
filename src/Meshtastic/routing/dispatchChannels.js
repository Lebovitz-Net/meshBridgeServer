import { insertHandlers } from '../../db/insertHandlers.js';
import { emitOverlay } from '../../overlays/overlayEmitter.js';
import { emitEvent } from '../../events/eventEmitter.js';
import { decodePythonString } from '../utils/stringUtils.js';

export const dispatchChannels = {
    channel: (subPacket) => {
        const { type, data, meta } = subPacket;
        const channel = data.channel;
        const settings = channel.settings;
        const { channelNum, name, psk, uplinkEnabled, downlinkEnabled, moduleSettings } = settings;

        if (channel?.role) {
        insertHandlers.insertChannel({
            channelNum: channelNum || 0,
            channelIdx: channel.index || 0,
            nodeNum: meta.fromNodeNum,
            protocol: 0,
            name: name || 'default',
            role: channel.role,
            psk: psk || null,
            options: { 
                moduleSettings: moduleSettings ? JSON.stringify(moduleSettings) : null,
                uplinkEnabled,
                downlinkEnabled
            },
            connId: meta.connId,
            timestamp: meta.timestamp,
        });
        }
  },
};
