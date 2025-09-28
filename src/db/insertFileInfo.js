// src/bridge/db/insertFileInfo.js

import db from './dbschema.js';

export function insertFileInfo(data) {
  const {filename, size, fromNodeNum, timestamp, connId, mime_type, description} = data;
  if (!filename || !size || !fromNodeNum) {
    console.warn('[insertFileInfo] Skipped insert: missing required fields', filename, size, num);
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO file_info (
      filename, size, mime_type, description,
      num, timestamp, conn_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    filename,
    size,
    mime_type || null,
    description || null,
    fromNodeNum,
    timestamp,
    connId || null
  );
}
