// portnums.js
// Central registry of MeshCore portNum values used in meshBridgeServer

export const portNums = {
  // Core MeshCore
  Advert: 0x00,
  Ping: 0x01,
  Data: 0x23,
  PathLearn: 0x2F,

  // Contact & Identity (BaseChatMesh / Coretact conventions)
  Contact: 0x21,
  ContactAck: 0x24,
  ContactRequest: 0x25,

  // Experimental / Custom
  Telemetry: 0x30,
  ContactSync: 0x31,
  DebugOverlay: 0x32,
  RegistryPush: 0x33,
}

  // Reserved Ranges
const Reserved = {
Core: [0x00, 0x1F],
Identity: [0x20, 0x2F],
Experimental: [0x30, 0x3F],
Custom: [0x40, 0x7F],
Vendor: [0x80, 0xFF]
}


// Reverse lookup table
const reverseMap = Object.entries(portNums)
  .filter(([key, val]) => typeof val === 'number')
  .reduce((acc, [key, val]) => {
    acc[val] = key
    return acc
  }, {})

// Helper: get name from portNum
export function getName(portNum) {
  return reverseMap[portNum] || `Unknown (0x${portNum.toString(16)})`
}

// Helper: check if portNum is known
export function isKnown(portNum) {
  return reverseMap.hasOwnProperty(portNum)
}

// Helper: check if portNum is custom/experimental
export function isCustom(portNum) {
  return portNum >= 0x30 && portNum <= 0x7F
}
