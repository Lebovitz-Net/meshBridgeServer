import db from '../db.js';

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
};
