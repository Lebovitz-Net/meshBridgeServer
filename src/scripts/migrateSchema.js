import fs from 'fs';
import path from 'path';
import db from './db.js';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../migrations');

export const runMigrations = () => {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    try {
      db.exec(sql);
      console.log(`✅ Applied migration: ${file}`);
    } catch (err) {
      console.error(`❌ Failed migration: ${file}`, err.message);
    }
  }
};
