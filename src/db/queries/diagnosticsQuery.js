import db from '../db.js';

// --- Diagnostic Queries ---
export const listLogs = (limit = 200) => {
  return db.prepare(`
    SELECT log_id, num, packet_type, raw_payload, timestamp
    FROM packet_logs
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(limit);
};

// --- Packet Queries ---
export const listPacketLogs = (limit = 100) => {
  return db.prepare(`
    SELECT log_id, num, packet_type, raw_payload, timestamp
    FROM packet_logs
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(limit);
};

export const getPacketLog = (id) => {
  return db.prepare(`
    SELECT log_id, num, packet_type, raw_payload, timestamp
    FROM packet_logs
    WHERE log_id = ?
  `).get(id);
};

export const listRecentPacketLogsForNode = (num, limit = 100) => {
  return db.prepare(`
    SELECT log_id, packet_type, timestamp, raw_payload
    FROM packet_logs
    WHERE num = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(num, limit);
};

export const getPacketLogById = (id) => {
  return db.prepare(`
    SELECT log_id, num, packet_type, raw_payload, timestamp
    FROM packet_logs
    WHERE log_id = ?
  `).get(id);
};
