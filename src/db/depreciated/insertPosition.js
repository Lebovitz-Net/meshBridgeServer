import db from './dbschema.js';

export function insertPosition(decoded) {
  const { fromNodeNum, toNodeNum, latitude, longitude, altitude, timestamp } = decoded;
  const ts = timestamp ?? Date.now();


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
