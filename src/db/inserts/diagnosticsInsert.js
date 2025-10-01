// --- Diagnostic Inserts ---
import db from '../dbschema.js';

export const insertLogRecord = (record) => {
  const stmt = db.prepare(`
    INSERT INTO log_records (log_id, num, message, timestamp)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(record.log_id, record.num, record.message, record.timestamp);
};

export const insertPacketLog = (packet) => {
  const stmt = db.prepare(`
    INSERT INTO packet_logs (log_id, num, packet_type, raw_payload, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(packet.log_id, packet.num, packet.packet_type, packet.raw_payload, packet.timestamp);
};

export const injectPacketLog = (packet) => {
  const stmt = db.prepare(`
    INSERT INTO packet_logs (num, packet_type, raw_payload, timestamp)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(packet.num, packet.packet_type, packet.raw_payload, packet.timestamp);
};

// Placeholder: overlay insert logic not yet implemented
export const insertDiagnosticOverlay = (overlay) => {
  throw new Error('insertDiagnosticOverlay not yet implemented');
};

export const insertOverlayPreview = (preview) => {
  throw new Error('insertOverlayPreview not yet implemented');
};

export const insertConfigMutation = (mutation) => {
  throw new Error('insertConfigMutation not yet implemented');
};
