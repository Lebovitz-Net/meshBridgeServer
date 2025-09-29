import db from './dbschema.js';

export function insertClientNotification(subPacket) {
  const { fromNodeNum, key, data, timestamp, device_id, connId } = subPacket;

  db.prepare(`
    INSERT INTO client_notification (
      num, type, payload, timestamp, device_id, conn_id
    ) VALUES ( ?, ?, ?, ?, ?, ? )
  `).run(
    fromNodeNum,
    key,
    data,
    timestamp,
    device_id,
    connId
  );
}
