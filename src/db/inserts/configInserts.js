// --- Config Inserts ---
import db from '../dbschema.js';

export const insertConfig = (config) => {
  const stmt = db.prepare(`
    INSERT INTO config (config_id, config_json, updated_at)
    VALUES (?, ?, ?)
  `);
  stmt.run(config.config_id, config.config_json, config.updated_at);
};

export const insertModuleConfig = (moduleConfig) => {
  const stmt = db.prepare(`
    INSERT INTO module_config (module_id, config_json, updated_at)
    VALUES (?, ?, ?)
  `);
  stmt.run(moduleConfig.module_id, moduleConfig.config_json, moduleConfig.updated_at);
};

export const insertMyInfo = (info) => {
  const stmt = db.prepare(`
    INSERT INTO my_info (num, label, public_key, updated_at)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(info.num, info.label, info.public_key, info.updated_at);
};

export const insertChannel = (channel) => {
  const stmt = db.prepare(`
    INSERT INTO channels (channel_id, name, num)
    VALUES (?, ?, ?)
  `);
  stmt.run(channel.channel_id, channel.name, channel.num);
};

export const insertConnection = (connection) => {
  const stmt = db.prepare(`
    INSERT INTO connections (connection_id, num, transport, status)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(connection.connection_id, connection.num, connection.transport, connection.status);
};

export const insertFileInfo = (fileInfo) => {
  const stmt = db.prepare(`
    INSERT INTO file_info (file_id, filename, size, uploaded_at)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(fileInfo.file_id, fileInfo.filename, fileInfo.size, fileInfo.uploaded_at);
};

export const insertMetadata = (metadata) => {
  const stmt = db.prepare(`
    INSERT INTO metadata (meta_id, key, value, updated_at)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(metadata.meta_id, metadata.key, metadata.value, metadata.updated_at);
};