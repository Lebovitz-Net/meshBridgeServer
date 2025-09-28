import db from './dbschema.js';

export function insertPosition({ fromNodeNum, toNodeNum, latitude, longitude, altitude, timestamp }) {
  const ts = timestamp ?? Date.now();

  // Upsert current state in nodes
  db.prepare(`
    INSERT INTO nodes (num, latitude, longitude, altitude, last_seen)
    VALUES (@num, @latitude, @longitude, @altitude, @ts)
    ON CONFLICT(num) DO UPDATE SET
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      altitude = excluded.altitude,
      last_seen = excluded.last_seen
  `).run({
    num: fromNodeNum,
    latitude: Number(latitude),
    longitude: Number(longitude),
    altitude: altitude != null ? Number(altitude) : null,
    ts
  });

  // Append to positions log
  db.prepare(`
    INSERT INTO positions (fromNodeNum, toNodeNum, latitude, longitude, altitude, timestamp)
    VALUES (@fromNodeNum, @toNodeNum, @latitude, @longitude, @altitude, @ts)
  `).run({
    fromNodeNum,
    toNodeNum,
    latitude: Number(latitude),
    longitude: Number(longitude),
    altitude: altitude != null ? Number(altitude) : null,
    ts
  });
}
