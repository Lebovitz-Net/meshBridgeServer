-- Step 1: Create new table with correct schema
CREATE TABLE nodes_new (
  num INTEGER PRIMARY KEY,
  label TEXT,
  last_seen INTEGER,
  viaMqtt BOOLEAN,
  hopsAway INTEGER,
  lastHeard INTEGER
);

-- Step 2: Migrate data from old table
INSERT INTO nodes_new (num, label, last_seen, viaMqtt, hopsAway, lastHeard)
SELECT node_id, label, last_seen, viaMqtt, hopsAway, lastHeard FROM nodes;

-- Step 3: Drop old table
DROP TABLE nodes;

-- Step 4: Rename new table
ALTER TABLE nodes_new RENAME TO nodes;
