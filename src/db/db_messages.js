export const dbMessages = [
    
    `CREATE TABLE IF NOT EXISTS messages (
      -- Core
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channelId INTEGER NOT NULL,
      message TEXT NOT NULL,
      sender TEXT,                         -- e.g. "Nick D"
      mentions TEXT,              -- JSON array: '["KD1MU", "W1AW"]'

      -- Meshtastic-specific
      fromNodeNum INTEGER,
      toNodeNum INTEGER,
      toNodeType INTEGER DEFAULT 0,
      messageId INTEGER,

      -- options (flags and options)
      options TEXT,

      -- Timestamps
      sentTimestamp INTEGER,              -- senderTimestamp
      recvTimestamp INTEGER,              -- meta.timestamp

      -- Protocol metadata
      protocol TEXT NOT NULL,             -- 'meshcore' | 'meshtastic'
      nodeId TEXT                         -- e.g. 'meshcore-1'
    );`,
];
