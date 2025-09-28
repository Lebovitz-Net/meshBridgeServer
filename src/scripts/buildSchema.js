import db from '../db/dbschema.js';
import {
  buildUserInfoTables,
  buildMetricsTables,
  buildDeviceConfigTables
} from '../db/dbschema.js';

function buildSchema() {
  console.log('[buildSchema] Starting schema build...');

  try {
    buildUserInfoTables();
    console.log('[buildSchema] User info tables created.');

    buildMetricsTables();
    console.log('[buildSchema] Metrics tables created.');

    buildDeviceConfigTables();
    console.log('[buildSchema] Device config tables created.');

    console.log('[buildSchema] ✅ Schema build complete.');
  } catch (err) {
    console.error('[buildSchema] ❌ Failed to build schema:', err);
  }
}

buildSchema();
