import { insertHandlers } from '../db/insertHandlers.js';
import { emitOverlay } from '../overlays/overlayEmitter.js';
import { emitEvent } from '../events/eventEmitter.js';
import { decodePythonString } from '../utils/stringUtils.js';

export const dispatchChannels = {
    channel: (subPacket) => {
        const { type, data, meta } = subPacket;
        const channel = data.channel;
        const settings = channel.settings;

        if (channel?.role) {
        insertHandlers.insertChannel({
            channel_num: settings?.channelNum || 0,
            num: meta.fromNodeNum,
            device_id: meta.device_id,
            index: channel.index || 0,
            name: settings.name || 'default',
            role: channel.role,
            psk: settings.psk || null,
            uplink_enabled: settings.uplinkEnabled ? 1: 0,
            downlink_enabled: settings.downlinkEnabled ? 1 : 0,
            module_settings_json: settings.moduleSettings ? JSON.stringify(settings.moduleSettings) : null,
            conn_id: meta.connId,
            timestamp: Date.now(),
        });
        }
  },
};
