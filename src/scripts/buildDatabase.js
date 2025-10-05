import fs from 'fs';
import path from 'path';
import { buildDatabase } from '../db/db.js';
import Database from 'better-sqlite3';



const dbDir = path.resolve(process.cwd(), 'data');
const dbFile = path.join(dbDir, 'meshmanager.db');

function buildMeshDatabase() {
  console.log('[buildDatabase] Initializing database...');

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`[buildDatabase] Created data directory at ${dbDir}`);
  }

  // Instantiating the DB will create the file if it doesn't exist
  console.log(`[buildDatabase] Creating or opening database at ${dbFile}...`);
  const db = new Database(dbFile);


  try {
    buildDatabase(db);
    console.log('[buildDatabase] ✅ Database build complete.');
  } catch (err) {
    console.error('[buildDatabase] ❌ Failed to build database:', err);
  }
}

buildMeshDatabase();
