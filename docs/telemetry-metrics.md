# Telemetry Metric Groups and Fields

This document outlines the known metric groups extracted from telemetry packets, based on protobuf definitions. Each group represents a distinct semantic domain and should be routed to its own insert handler and stored in a dedicated table.

---

## 📦 Metric Groups

### **DeviceMetrics**
- `batteryLevel`
- `txPower`
- `uptime`
- `cpuTemp`
- `memoryUsage`

### **EnvironmentMetrics**
- `temperature`
- `humidity`
- `pressure`
- `lightLevel`

### **AirQualityMetrics**
- `pm25`
- `pm10`
- `co2`
- `voc`
- `ozone`

### **PowerMetrics**
- `voltage`
- `current`
- `power`
- `energy`
- `frequency`

### **LocalStats**
- `snr`
- `rssi`
- `hopCount`
- `linkQuality`
- `packetLoss`

### **HealthMetrics**
- `cpuTemp`
- `diskUsage`
- `memoryUsage`
- `uptime`
- `loadAvg`

### **HostMetrics**
- `hostname`
- `uptime`
- `loadAvg`
- `osVersion`
- `bootTime`

---

## 🧠 Notes

- Field overlap exists across groups (e.g. `uptime`, `cpuTemp`, `memoryUsage`)—each should be tagged by origin.
- All insert handlers should include:
  - `fromNodeNum`
  - `toNodeNum`
  - `timestamp`
- Tables should reflect these field sets exactly, using camelCase naming and foreign key constraints where applicable.

## Data Types

# Telemetry Metric Groups and Field Types

This section documents the known metric groups extracted from telemetry packets, based on protobuf definitions. Each group is treated as a distinct domain and should be stored in its own table for schema clarity, protocol fidelity, and future scalability.

---

## 📦 Metric Groups

### **DeviceMetrics**
| Field         | Type     |
|---------------|----------|
| batteryLevel  | float    |
| txPower       | int32    |
| uptime        | uint32   |
| cpuTemp       | float    |
| memoryUsage   | float    |

---

### **EnvironmentMetrics**
| Field        | Type     |
|--------------|----------|
| temperature  | float    |
| humidity     | float    |
| pressure     | float    |
| lightLevel   | float    |

---

### **AirQualityMetrics**
| Field   | Type     |
|---------|----------|
| pm25    | float    |
| pm10    | float    |
| co2     | float    |
| voc     | float    |
| ozone   | float    |

---

### **PowerMetrics**
| Field     | Type     |
|-----------|----------|
| voltage   | float    |
| current   | float    |
| power     | float    |
| energy    | float    |
| frequency | float    |

---

### **LocalStats**
| Field       | Type     |
|-------------|----------|
| snr         | float    |
| rssi        | float    |
| hopCount    | uint32   |
| linkQuality | float    |
| packetLoss  | float    |

---

### **HealthMetrics**
| Field        | Type     |
|--------------|----------|
| cpuTemp      | float    |
| diskUsage    | float    |
| memoryUsage  | float    |
| uptime       | uint32   |
| loadAvg      | float    |

---

### **HostMetrics**
| Field      | Type     |
|------------|----------|
| hostname   | string   |
| uptime     | uint32   |
| loadAvg    | float    |
| osVersion  | string   |
| bootTime   | uint32   |

---

## 🧠 Notes

- Field overlap exists across groups (e.g. `uptime`, `cpuTemp`, `memoryUsage`)—each should be tagged by origin.
- All insert handlers should include:
  - `fromNodeNum`
  - `toNodeNum`
  - `timestamp`
- Tables should reflect these field sets exactly, using camelCase naming and foreign key constraints where applicable.
