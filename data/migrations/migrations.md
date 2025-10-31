meshmanager/
├── migrations/
│   ├── 2025-09-21_add_hopsAway_to_nodes.sql
│   ├── 2025-09-21_create_device_metrics.sql
│   └── README.md
├── src/
│   └── bridge/
│       └── db/
│           └── migrateSchema.js


# Meshmanager Migrations

This folder contains versioned SQL migration scripts for evolving the meshmanager schema.

## Usage

Run each migration manually or via `migrateSchema.js` to apply schema changes safely.

## Applied Migrations

- `2025-09-21_add_hopsAway_to_nodes.sql`: Adds `hopsAway` to `nodes`
- `2025-09-21_create_device_metrics.sql`: Creates `device_metrics` table

## Notes

- All migrations are idempotent where possible
- Contributors should annotate rationale and usage
