import db from './dbschema.js';
import { setMapping } from '../core/connectionManager.js';

export async function insertMyInfo(packet) {

  const { myNodeNum, deviceId, currentIP } = packet;

  setMapping(currentIP, myNodeNum, deviceId);

  if (!myNodeNum || !deviceId) {
    console.warn('[insertMyInfo] Missing required fields:', { myNodeNum, deviceId });
    return;
  }
  try {
    await db.prepare(
      `INSERT INTO my_info (
        myNodeNum, deviceId, rebootCount, minAppVersion, pioEnv, currentIP, connId, timestamp
      ) VALUES (@myNodeNum, @deviceId, @rebootCount, @minAppVersion, @pioEnv, @currentIP, @connId, @timestamp)
      ON CONFLICT(myNodeNum) DO UPDATE SET
        deviceId = excluded.deviceId,
        rebootCount = excluded.rebootCount,
        minAppVersion = excluded.minAppVersion,
        pioEnv = excluded.pioEnv,
        currentIP = excluded.currentIP,
        connId = excluded.connId,
        timestamp = excluded.timestamp`
    ).run({
        ...packet,
        timestamp: Date.now(),
    })
  } catch (err) {
    console.error('[insertMyInfo] DB insert failed:', err);
  }
}
