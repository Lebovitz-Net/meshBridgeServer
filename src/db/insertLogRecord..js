import db from './dbschema.js';

export function insertLogRecord(data) {
  const { message, decoded, fromNodeNum, timestamp, connId } = data;
console.log('...insertLogRecord decode', decoded);
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
      num, packetType, rawMessage, timestamp, connId, decodeStatus
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    fromNodeNum,
    'logRecord',
    JSON.stringify(decoded),
    timestamp,
    connId || null,
    1
  );
}
