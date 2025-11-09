export const dbMessages = [
    
    `CREATE TABLE IF NOT EXISTS messages (
      -- Core
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channelId INTEGER NOT NULL,
      message TEXT NOT NULL,
      txtType INTEGER DEFAULT 0,
      sender TEXT,                         -- e.g. "Nick D"
      mentionedUserIds TEXT,              -- JSON array: '["KD1MU", "W1AW"]'

      -- Meshtastic-specific
      fromNodeNum INTEGER,
      toNodeNum INTEGER,
      toNodeType INTEGER DEFAULT 0,
      messageId INTEGER,
      replyId TEXT,

      -- Flags
      wantReply BOOLEAN DEFAULT 0,
      wantAck BOOLEAN DEFAULT 0,
      viaMqtt BOOLEAN DEFAULT 0,

      -- Timestamps
      sentTimestamp INTEGER,              -- senderTimestamp
      recvTimestamp INTEGER,              -- meta.timestamp

      -- Protocol metadata
      protocol TEXT NOT NULL,             -- 'meshcore' | 'meshtastic'
      nodeId TEXT                         -- e.g. 'meshcore-1'
    );`,
];
