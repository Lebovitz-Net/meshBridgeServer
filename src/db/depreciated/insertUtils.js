// insertUtils.js
// Utility insert functions for packet-level diagnostics and manual injection.
// All inserts are dry-run safe and timestamped for traceability.

import db from './dbschema.js';

/**
 * Inject a packet log manually into the packet_logs table.
 * Used for diagnostics, replay, or testing.
 *
 * @param {Object} packet - The packet object to insert.
 * @param {number} packet.num - Node number associated with the packet.
 * @param {string} packet.packet_type - Type of packet (e.g. 'telemetry', 'event').
 * @param {Object|string} packet.raw_payload - Raw payload (will be JSON-stringified).
 * @param {number} [packet.timestamp] - Optional UNIX timestamp. Defaults to now.
 * @returns {Object} - Result with inserted flag and log_id.
 */
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

// --- Node Deletion ---
export const deleteNode = (num) => {
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM nodes WHERE num = ?`).run(num);
    db.prepare(`DELETE FROM users WHERE nodeNum = ?`).run(num);
    db.prepare(`DELETE FROM channels WHERE num = ?`).run(num);
    db.prepare(`DELETE FROM connections WHERE num = ?`).run(num);
    db.prepare(`DELETE FROM device_metrics WHERE num = ?`).run(num);
    db.prepare(`DELETE FROM telemetry WHERE num = ?`).run(num);
    db.prepare(`DELETE FROM event_emissions WHERE num = ?`).run(num);
    db.prepare(`DELETE FROM packet_logs WHERE num = ?`).run(num);
  });

  tx(); // Execute transaction
};
