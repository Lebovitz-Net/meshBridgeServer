import db from './dbschema.js';

export function insertModuleConfig(subPacket) {
  const { fromNodeNum, key, data, timestamp, device_id, connId } = subPacket;

  db.prepare(`
    INSERT INTO module_config (
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
