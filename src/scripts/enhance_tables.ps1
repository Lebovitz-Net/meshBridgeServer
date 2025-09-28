# Requires: System.Data.SQLite.dll in the load path
Add-Type -Path "C:\path\to\System.Data.SQLite.dll"

function Ensure-NodeTables {
    param([string]$DbPath)

    $conn = New-Object System.Data.SQLite.SQLiteConnection "Data Source=$DbPath"
    $conn.Open()

    $cmd = $conn.CreateCommand()
    $cmd.CommandText = @"
CREATE TABLE IF NOT EXISTS nodes (
    id INTEGER PRIMARY KEY,
    num INTEGER UNIQUE NOT NULL,
    last_heard INTEGER,
    via_mqtt BOOLEAN,
    hops_away INTEGER
);
CREATE TABLE IF NOT EXISTS users (
    node_id INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    user_id TEXT,
    long_name TEXT,
    short_name TEXT,
    macaddr TEXT,
    hw_model INTEGER,
    public_key TEXT,
    is_unmessagable BOOLEAN,
    UNIQUE(node_id)
);
CREATE TABLE IF NOT EXISTS device_metrics (
    node_id INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    ts INTEGER DEFAULT (strftime('%s','now')),
    battery_level REAL,
    voltage REAL,
    channel_utilization REAL,
    air_util_tx REAL,
    uptime_seconds INTEGER
);
CREATE INDEX IF NOT EXISTS idx_nodes_num ON nodes(num);
CREATE INDEX IF NOT EXISTS idx_users_node_id ON users(node_id);
CREATE INDEX IF NOT EXISTS idx_metrics_node_id_ts ON device_metrics(node_id, ts);
"@
    $cmd.ExecuteNonQuery() | Out-Null
    $conn.Close()
}

function Upsert-NodeInfo {
    param(
        [string]$DbPath,
        [hashtable]$NodeInfo
    )

    $conn = New-Object System.Data.SQLite.SQLiteConnection "Data Source=$DbPath"
    $conn.Open()

    # 1️⃣ Upsert into nodes
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = @"
INSERT INTO nodes (num, last_heard, via_mqtt, hops_away)
VALUES (@num, @last_heard, @via_mqtt, @hops_away)
ON CONFLICT(num) DO UPDATE SET
    last_heard = excluded.last_heard,
    via_mqtt   = excluded.via_mqtt,
    hops_away  = excluded.hops_away;
"@
    $cmd.Parameters.AddWithValue("@num", $NodeInfo.num) | Out-Null
    $cmd.Parameters.AddWithValue("@last_heard", $NodeInfo.lastHeard) | Out-Null
    $cmd.Parameters.AddWithValue("@via_mqtt", $NodeInfo.viaMqtt) | Out-Null
    $cmd.Parameters.AddWithValue("@hops_away", $NodeInfo.hopsAway) | Out-Null
    $cmd.ExecuteNonQuery() | Out-Null

    # Get node_id
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT id FROM nodes WHERE num = @num"
    $cmd.Parameters.AddWithValue("@num", $NodeInfo.num) | Out-Null
    $nodeId = $cmd.ExecuteScalar()
    if (-not $nodeId) { $conn.Close(); return }

    # 2️⃣ Upsert into users
    if ($NodeInfo.user) {
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = @"
INSERT INTO users (node_id, user_id, long_name, short_name, macaddr, hw_model, public_key, is_unmessagable)
VALUES (@node_id, @user_id, @long_name, @short_name, @macaddr, @hw_model, @public_key, @is_unmessagable)
ON CONFLICT(node_id) DO UPDATE SET
    user_id         = excluded.user_id,
    long_name       = excluded.long_name,
    short_name      = excluded.short_name,
    macaddr         = excluded.macaddr,
    hw_model        = excluded.hw_model,
    public_key      = excluded.public_key,
    is_unmessagable = excluded.is_unmessagable;
"@
        $cmd.Parameters.AddWithValue("@node_id", $nodeId) | Out-Null
        $cmd.Parameters.AddWithValue("@user_id", $NodeInfo.user.id) | Out-Null
        $cmd.Parameters.AddWithValue("@long_name", $NodeInfo.user.longName) | Out-Null
        $cmd.Parameters.AddWithValue("@short_name", $NodeInfo.user.shortName) | Out-Null
        $cmd.Parameters.AddWithValue("@macaddr", $NodeInfo.user.macaddr) | Out-Null
        $cmd.Parameters.AddWithValue("@hw_model", $NodeInfo.user.hwModel) | Out-Null
        $cmd.Parameters.AddWithValue("@public_key", $NodeInfo.user.publicKey) | Out-Null
        $cmd.Parameters.AddWithValue("@is_unmessagable", $NodeInfo.user.isUnmessagable) | Out-Null
        $cmd.ExecuteNonQuery() | Out-Null
    }

    # 3️⃣ Insert into device_metrics
    if ($NodeInfo.deviceMetrics) {
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = @"
INSERT INTO device_metrics (node_id, battery_level, voltage, channel_utilization, air_util_tx, uptime_seconds)
VALUES (@node_id, @battery_level, @voltage, @channel_utilization, @air_util_tx, @uptime_seconds);
"@
        $cmd.Parameters.AddWithValue("@node_id", $nodeId) | Out-Null
        $cmd.Parameters.AddWithValue("@battery_level", $NodeInfo.deviceMetrics.batteryLevel) | Out-Null
        $cmd.Parameters.AddWithValue("@voltage", $NodeInfo.deviceMetrics.voltage) | Out-Null
        $cmd.Parameters.AddWithValue("@channel_utilization", $NodeInfo.deviceMetrics.channelUtilization) | Out-Null
        $cmd.Parameters.AddWithValue("@air_util_tx", $NodeInfo.deviceMetrics.airUtilTx) | Out-Null
        $cmd.Parameters.AddWithValue("@uptime_seconds", $NodeInfo.deviceMetrics.uptimeSeconds) | Out-Null
        $cmd.ExecuteNonQuery() | Out-Null
    }

    $conn.Close()
}

# Example usage:
# Ensure-NodeTables -DbPath "C:\path\to\meshmanager.sqlite"
$nodeInfo = @{
    num = 3859538371
    lastHeard = 1758397539
    viaMqtt = $true
    hopsAway = 3
    user = @{
        id = '!e60be1c3'
        longName = 'ivmden-m1'
        shortName = 'i-m1'
        macaddr = 'f926e60be1c3'
        hwModel = 9
        publicKey = 'fc24d78d8a702092dff74a4fd9cbaf9353911995c5619eefe3434f4f4fd8b774'
        isUnmessagable = $true
    }
    deviceMetrics = @{
        batteryLevel = 62
        voltage = 3.824
        channelUtilization = 13.90
        airUtilTx = 1.272
        uptimeSeconds = 432063
    }
}
Upsert-NodeInfo -DbPath ".\meshmanager.db" -NodeInfo $nodeInfo
