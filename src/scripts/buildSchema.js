import db from '../db/db.js';
import { buildDatabase } from '../db/db.js';

function buildSchema() {
  console.log('[buildSchema] Starting schema build...');

  try {
    buildDatabase();
    console.log('[buildSchema] ✅ Schema build complete.');
  } catch (err) {
    console.error('[buildSchema] ❌ Failed to build schema:', err);
  }
}

buildSchema();
