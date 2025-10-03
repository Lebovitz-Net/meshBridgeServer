// --- Diagnostic Inserts ---
import db from '../dbschema.js';
import { dbBoolean } from '../dbschema.js';

// Insert Log Record ==========================================================
export function insertLogRecord(data) {
  const { message, fromNodeNum, timestamp, connId } = data;

  if (!message || typeof fromNodeNum !== 'number') {
    console.warn('[insertLogRecord] Skipped insert: missing required fields', { message, fromNodeNum, timestamp });
    return;
  }

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO log_records (
      num, packetType, message, timestamp, connId, decodeStatus
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(fromNodeNum, 'logRecord', message, timestamp, connId, dbBoolean(true));
}

// Insert Packet Log ==========================================================
export function insertPacketLog({ num, packet_type, timestamp, raw_payload }) {
  if (!num) {
    console.warn(`[insertPacketLog] Skipping log: no num provided`);
    return false;
  }

  const exists = db.prepare(`
    SELECT 1 FROM nodes WHERE num = ?
  `).get(num);

  if (!exists) {
    console.warn(`[insertPacketLog] Skipping log: no parent node for num=${num}`);
    return false;
  }

  db.prepare(`
    INSERT INTO packet_logs (
      num,
      packet_type,
      timestamp,
      raw_payload
    )
    VALUES (?, ?, ?, ?)
  `).run(num, packet_type, timestamp, raw_payload);

  return true;
}

// Inject Packet Log ==========================================================
export const injectPacketLog = (packet) => {
  const { num, packet_type, raw_payload, timestamp = Math.floor(Date.now() / 1000) } = packet;

  if (!num || !packet_type || !raw_payload) {
    throw new Error('Missing required fields: num, packet_type, raw_payload');
  }

  const payload = typeof raw_payload === 'string' ? raw_payload : JSON.stringify(raw_payload);

  db.prepare(`
    INSERT INTO packet_logs (num, packet_type, raw_payload, timestamp)
    VALUES (?, ?, ?, ?)
  `).run(num, packet_type, payload, timestamp);

  const { id } = db.prepare(`SELECT last_insert_rowid() AS id`).get();
  return { inserted: true, log_id: id };
};

// Optional placeholders (new in current) =====================================
export const insertDiagnosticOverlay = (overlay) => {
  throw new Error('insertDiagnosticOverlay not yet implemented');
};

export const insertOverlayPreview = (preview) => {
  throw new Error('insertOverlayPreview not yet implemented');
};

export const insertConfigMutation = (mutation) => {
  throw new Error('insertConfigMutation not yet implemented');
};
