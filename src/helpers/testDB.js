// test/helpers/testDb.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';

// Load your schema.sql or SCHEMA.md definitions
const schemaSql = fs.readFileSync(path.resolve('src/db/schema.sql'), 'utf8');

let db;

export async function initTestDb() {
  db = await open({
    filename: ':memory:',
    driver: sqlite3.Database,
  });
  await db.exec(schemaSql);
  return db;
}

export async function resetDb() {
  // Drop all tables and re‑apply schema
  await db.exec('PRAGMA writable_schema = 1; DELETE FROM sqlite_master WHERE type IN ("table", "index", "trigger"); PRAGMA writable_schema = 0; VACUUM;');
  await db.exec(schemaSql);
}

export function getDb() {
  return db;
}
