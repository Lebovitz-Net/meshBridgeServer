import db from './dbschema.js';

export const insertUser = (user, nodeNum = null, { dryRun = false } = {}) => {
  if (!user?.id) {
    console.warn('[insertUser] Skipping insert: user.id is missing');
    return;
  }

  const payload = {
    id: user.id,
    longName: user.longName ?? null,
    shortName: user.shortName ?? null,
    macaddr: user.macaddr ?? null,
    hwModel: user.hwModel ?? null,
    publicKey: user.publicKey ?? null,
    isUnmessagable: user.isUnmessagable ? 1 : 0,
    nodeNum
  };

  if (dryRun) {
    console.log('[insertNodeUser] Dry-run insert:', payload);
    return;
  }

  db.prepare(`
    INSERT INTO node_users (
      id,
      longName,
      shortName,
      macaddr,
      hwModel,
      publicKey,
      isUnmessagable,
      nodeNum
    )
    VALUES (
      @id,
      @longName,
      @shortName,
      @macaddr,
      @hwModel,
      @publicKey,
      @isUnmessagable,
      @nodeNum
    )
    ON CONFLICT(id) DO UPDATE SET
      longName = excluded.longName,
      shortName = excluded.shortName,
      macaddr = excluded.macaddr,
      hwModel = excluded.hwModel,
      publicKey = excluded.publicKey,
      isUnmessagable = excluded.isUnmessagable,
      nodeNum = excluded.nodeNum
  `).run(payload);
};
