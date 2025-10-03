import db from './dbschema.js';

export function insertLogRecord(data) {
  const { message, fromNodeNum, timestamp, connId } = data;

  if (!message || typeof fromNodeNum !== 'number' || typeof timestamp !== 'number') {
    console.warn('[insertLogRecord] Skipped insert: missing required fields', {
      message,
      fromNodeNum,
      timestamp
    });
    return;
  }

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO log_records (
      num, packetType, message, timestamp, connId, decodeStatus
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    fromNodeNum,
    'logRecord',
    message,
    timestamp,
    connId || null,
    0
  );
}
