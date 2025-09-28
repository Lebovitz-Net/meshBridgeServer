// db/upsertNodeInfo.js
// usage: upsertNodeInfo(db, nodeInfo)
import Database from 'better-sqlite3';

export function upsertNodeInfo(db, nodeInfo) {
  if (!nodeInfo?.num) {
    console.warn('[DB] Skipping nodeInfo with no num:', nodeInfo);
    return;
  }

  const upsert = db.transaction((ni) => {
    // 1) nodes upsert
    db.prepare(`
      INSERT INTO nodes (num, last_heard, via_mqtt, hops_away)
      VALUES (@num, @last_heard, @via_mqtt, @hops_away)
      ON CONFLICT(num) DO UPDATE SET
        last_heard = excluded.last_heard,
        via_mqtt   = excluded.via_mqtt,
        hops_away  = excluded.hops_away
    `).run({
      num: ni.num,
      last_heard: ni.lastHeard ?? null,
      via_mqtt: ni.viaMqtt ? 1 : 0,
      hops_away: ni.hopsAway ?? null
    });

    const row = db.prepare(`SELECT id FROM nodes WHERE num = ?`).get(ni.num);
    if (!row?.id) return;
    const nodeId = row.id;

    // 2) users upsert (1:1)
    if (ni.user) {
      db.prepare(`
        INSERT INTO users (node_id, user_id, long_name, short_name, macaddr, hw_model, public_key, is_unmessagable)
        VALUES (@node_id, @user_id, @long_name, @short_name, @macaddr, @hw_model, @public_key, @is_unmessagable)
        ON CONFLICT(node_id) DO UPDATE SET
          user_id         = excluded.user_id,
          long_name       = excluded.long_name,
          short_name      = excluded.short_name,
          macaddr         = excluded.macaddr,
          hw_model        = excluded.hw_model,
          public_key      = excluded.public_key,
          is_unmessagable = excluded.is_unmessagable
      `).run({
        node_id: nodeId,
        user_id: ni.user.id ?? null,
        long_name: ni.user.longName ?? null,
        short_name: ni.user.shortName ?? null,
        macaddr: ni.user.macaddr ?? null,
        hw_model: ni.user.hwModel ?? null,
        public_key: ni.user.publicKey ?? null,
        is_unmessagable: ni.user.isUnmessagable ? 1 : 0
      });
    }

    // 3) device_metrics insert (historical)
    if (ni.deviceMetrics) {
      db.prepare(`
        INSERT INTO device_metrics (node_id, battery_level, voltage, channel_utilization, air_util_tx, uptime_seconds)
        VALUES (@node_id, @battery_level, @voltage, @channel_utilization, @air_util_tx, @uptime_seconds)
      `).run({
        node_id: nodeId,
        battery_level: ni.deviceMetrics.batteryLevel ?? null,
        voltage: ni.deviceMetrics.voltage ?? null,
        channel_utilization: ni.deviceMetrics.channelUtilization ?? null,
        air_util_tx: ni.deviceMetrics.airUtilTx ?? null,
        uptime_seconds: ni.deviceMetrics.uptimeSeconds ?? null
      });
    }
  });

  upsert(nodeInfo);
}

const nodeInfo = {
  num: 3859538371,
  user: {
    id: '!e60be1c3',
    longName: 'ivmden-m1',
    shortName: 'i-m1',
    macaddr: 'f926e60be1c3',
    hwModel: 9,
    publicKey: 'fc24d78d8a702092dff74a4fd9cbaf9353911995c5619eefe3434f4f4fd8b774',
    isUnmessagable: true
  },
  lastHeard: 1758397539,
  deviceMetrics: {
    batteryLevel: 62,
    voltage: 3.8239998817443848,
    channelUtilization: 13.901667594909668,
    airUtilTx: 1.272194504737854,
    uptimeSeconds: 432063
  },
  viaMqtt: true,
  hopsAway: 3
};
const db = new Database('meshmanager.db');
upsertNodeInfo(db, nodeInfo);
