import db from '../db.js';
import { emitChannelUpdate } from '../../Meshtastic/utils/sseEmitters.js';


export const insertChannel = (packet) => {

  db.prepare(`
    INSERT OR REPLACE INTO channels (
      channel_num, num, "index", name, role, psk,
      uplink_enabled, downlink_enabled, module_settings_json, timestamp
    ) VALUES (@channel_num, @num, @index, @name, @role, @psk,
      @uplink_enabled, @downlink_enabled, @module_settings_json, @timestamp)
  `).run({
    ...packet,
  });
  emitChannelUpdate({
  ...packet,
  updatedAt: Date.now()
});

};
