# MeshManager Database Schema

This document defines the relational schema used by MeshManager.  
It is designed for modular ingestion, protocol fidelity, and onboarding clarity.  
All tables are created with dry-run safety and support upserts for idempotent inserts.

---

## 🧩 Device Tables

### `devices`
Canonical registry of mesh devices.

| Column      | Type       | Description                            |
|-------------|------------|----------------------------------------|
| device_id   | TEXT PK    | Unique device identifier               |
| num         | INTEGER    | Node number (optional, FK → nodes)     |
| conn_id     | TEXT       | Connection source                      |
| device_type | TEXT       | Device type (default: 'meshtastic')    |
| last_seen   | INTEGER    | UNIX timestamp of last activity        |

---

### `device_settings`
Normalized config fragments keyed by type.

| Column       | Type     | Description                            |
|--------------|----------|----------------------------------------|
| device_id    | TEXT     | Foreign key to `devices`               |
| num          | INTEGER  | Foreign key to `nodes` (optional)      |
| config_type  | TEXT     | Fragment type (e.g. 'position', 'mqtt')|
| config_json  | TEXT     | Raw JSON string of config              |
| conn_id      | TEXT     | Source of config                       |
| updated_at   | INTEGER  | UNIX timestamp                         |

Primary key: `(device_id, config_type)`

---

### `device_meta`
Structured metadata from `myInfo` and `metadata`.

| Column           | Type     | Description                          |
|------------------|----------|--------------------------------------|
| device_id        | TEXT     | Foreign key to `devices`             |
| num              | INTEGER  | Foreign key to `nodes` (optional)    |
| reboot_count     | INTEGER  | Number of reboots                    |
| min_app_version  | TEXT     | Minimum supported app version        |
| pio_env          | TEXT     | PlatformIO environment               |
| firmware_version | TEXT     | Firmware version string              |
| hw_model         | TEXT     | Hardware model enum                  |
| conn_id          | TEXT     | Source of metadata                   |
| updated_at       | INTEGER  | UNIX timestamp                       |

---

### `device_ip_map`
Mapping of source IPs to device identity.

| Column    | Type     | Description                            |
|-----------|----------|----------------------------------------|
| source_ip | TEXT PK  | Unique key for mapping                 |
| num       | INTEGER  | Node number (FK → nodes.num)           |
| device_id | TEXT     | Device identifier string               |
| last_seen | INTEGER  | UNIX timestamp of last packet          |

---

## 🧠 Node Tables

### `nodes`
Registry of known nodes.

| Column     | Type     | Description                            |
|------------|----------|----------------------------------------|
| num        | INTEGER PK | Canonical node number                |
| label      | TEXT     | Human-readable label                   |
| last_seen  | INTEGER  | UNIX timestamp                         |
| viaMqtt    | BOOLEAN  | Whether seen via MQTT                  |
| hopsAway   | INTEGER  | Hop distance                           |
| lastHeard  | INTEGER  | UNIX timestamp                         |

---

### `users`
User identity and public key mapping.

| Column        | Type     | Description                          |
|---------------|----------|--------------------------------------|
| id            | TEXT PK  | Unique user identifier               |
| longName      | TEXT     | Full name                            |
| shortName     | TEXT     | Short name                           |
| macaddr       | TEXT     | MAC address                          |
| hwModel       | INTEGER  | Hardware model                       |
| publicKey     | TEXT     | Public key                           |
| isUnmessagable| BOOLEAN  | Whether user can receive messages    |
| nodeNum       | INTEGER  | Foreign key to `nodes(num)`          |

---

### `channels`
Channel registry per node.

| Column              | Type     | Description                       |
|---------------------|----------|-----------------------------------|
| channel_id          | TEXT PK  | Channel identifier                |
| num                 | INTEGER  | Foreign key to `nodes(num)`       |
| device_id           | TEXT     | Optional FK to `devices`          |
| index               | INTEGER  | Channel index                     |
| name                | TEXT     | Channel name                      |
| role                | TEXT     | Role string                       |
| psk                 | TEXT     | Pre-shared key                    |
| uplink_enabled      | BOOLEAN  | Uplink enabled flag               |
| downlink_enabled    | BOOLEAN  | Downlink enabled flag             |
| module_settings_json| TEXT     | JSON-encoded module settings      |
| timestamp           | INTEGER  | UNIX timestamp                    |
| conn_id             | TEXT     | Connection/session identifier     |

---

### `messages`
Messages sent on channels.

| Column      | Type     | Description                            |
|-------------|----------|----------------------------------------|
| message_id  | TEXT PK  | Unique message identifier              |
| channel_id  | TEXT     | Foreign key to `channels(channel_id)`  |
| sender      | TEXT     | Sender ID                              |
| content     | TEXT     | Message body                           |
| timestamp   | INTEGER  | UNIX timestamp                         |

---

### `connections`
Transport-level connection info.

| Column        | Type     | Description                          |
|---------------|----------|--------------------------------------|
| connection_id | TEXT PK  | Unique connection identifier         |
| num           | INTEGER  | Foreign key to `nodes(num)`          |
| transport     | TEXT     | Transport type (e.g. 'serial','mqtt')|
| status        | TEXT     | Connection status                    |

---

## 📊 Metrics & Logs

### `device_metrics`
Periodic metrics from devices.

| Column            | Type     | Description                        |
|-------------------|----------|------------------------------------|
| num               | INTEGER  | Foreign key to `nodes(num)`        |
| timestamp         | INTEGER  | UNIX timestamp                     |
| batteryLevel      | INTEGER  | Battery percentage                 |
| voltage           | REAL     | Voltage reading                    |
| channelUtilization| REAL     | Channel usage                      |
| airUtilTx         | REAL     | Air utilization (TX)               |
| uptimeSeconds     | INTEGER  | Device uptime                      |

---

### `telemetry`
Sensor telemetry readings.

| Column      | Type     | Description                            |
|-------------|----------|----------------------------------------|
| telemetry_id| INTEGER PK AUTOINC | Unique telemetry row         |
| num         | INTEGER  | Foreign key to `nodes(num)`            |
| metric      | TEXT     | Metric name                            |
| value       | REAL     | Metric value                           |
| timestamp   | INTEGER  | UNIX timestamp                         |

---

### `event_emissions`
Event logs from devices.

| Column      | Type     | Description                            |
|-------------|----------|----------------------------------------|
| event_id    | INTEGER PK AUTOINC | Unique event row             |
| num         | INTEGER  | Foreign key to `nodes(num)`            |
| event_type  | TEXT     | Event type                             |
| details     | TEXT     | JSON-encoded details                   |
| timestamp   | INTEGER  | UNIX timestamp                         |

---

### `packet_logs`
Raw packet payloads for diagnostics.

| Column      | Type     | Description                            |
|-------------|----------|----------------------------------------|
| log_id      | INTEGER PK AUTOINC | Unique log row               |
| num         | INTEGER  | Foreign key to `nodes(num)`            |
| packet_type | TEXT     | Packet type                            |
| timestamp   | INTEGER  | UNIX timestamp                         |
| raw_payload | TEXT     | JSON-encoded payload                   |

---

### `queue_status`
Queue status reports from devices.

| Column        | Type     | Description                          |
|---------------|----------|--------------------------------------|
| num           | INTEGER  | Foreign key to `nodes(num)`          |
| device_id     | TEXT     | Optional FK to `devices`             |
| res           | INTEGER  | Queue resource                       |
| free          | INTEGER  | Free slots                           |
| maxlen        | INTEGER  | Max queue length                     |
| mesh_packet_id| TEXT     | Optional mesh packet identifier      |
| timestamp     | INTEGER  | UNIX timestamp                       |
| conn_id       | TEXT     | Connection/session identifier        |

---

### `file_info`
File transfer metadata.

| Column      | Type     | Description                            |
|-------------|----------|----------------------------------------|
| file_id     | INTEGER PK AUTOINC | Unique file row              |
| num         | INTEGER  | Foreign key to `nodes(num)`            |
| device_id   | TEXT     | Optional FK to `devices`               |
| filename    | TEXT     | File name                              |
| size        | INTEGER  | File size in bytes                     |
| mime_type   | TEXT     | MIME type                              |
| description | TEXT     | Optional description                   |
| timestamp   | INTEGER  | UNIX timestamp                         |
| conn_id     | TEXT     | Connection/session identifier          |

---

## 🧑‍💻 Notes

- All inserts are dry-run safe and idempotent.  
- All foreign keys are enforced for relational integrity.  
- All timestamps use `Date.now()` (epoch ms).  
- All config fragments are stored as raw JSON for flexibility.  
- Cache (`ipToDeviceMap`) is hydrated from `device_ip_map` at startup and updated on identity packets.
