import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { dbNodes } from './db_nodes.js';
import { dbMetrics } from './db_metrics.js';
import { dbMessages } from './db_messages.js';
import { dbMaps } from  './db_maps.js';
import { dbDiagnostics } from './db_diagnostics.js';
import { dbConnections } from './db_connections.js';
import { dbConfigs } from './db_configs.js';
import { dbContacts } from './db_contacts.js';
import { dbChannels } from './db_channels.js';

const tables = [
  ...dbContacts,
  ...dbChannels,
  ...dbConfigs,
  ...dbConnections,
  ...dbDiagnostics,
  ...dbMaps,
  ...dbMessages,
  ...dbMetrics,
  ...dbNodes,
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, '../../data/meshmanager.db');
console.log('[db] Opening DB at:', dbPath);

const TRUE = 1;
const FALSE = 0;
export const dbBoolean = (val) => val ? TRUE : FALSE;

const db = new Database(dbPath);

export const buildDatabase = (db) => {
  tables.forEach((sql, i) => {
    try {
      db.exec(sql);
      const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] ?? `Table ${i + 1}`;
      console.log(`[DB] Created: ${tableName}`);
    } catch (err) {
      console.error(`[DB] Error creating table ${i + 1}: ${err.message}`);
    }
  });
};

export const applyMigrations = (db) => {
  const currentVersion = db.prepare(`SELECT value FROM schema_meta WHERE key = 'schemaVersion'`).get()?.value ?? 0;

  for (const { version, tables } of dbSchemas) {
    if (version > currentVersion) {
      console.log(`[DB] Applying schema version ${version}`);
      for (const sql of tables) {
        try {
          db.exec(sql);
          console.log(`[DB] Executed: ${sql.split('\n')[0].trim()}`);
        } catch (err) {
          console.error(`[DB] Error: ${err.message}`);
        }
      }
      db.prepare(`REPLACE INTO schema_meta (key, value) VALUES ('schemaVersion', ?)`).run(version);
      console.log(`[DB] Updated schema version to ${version}`);
    }
  }
};

export default db;
