// test/fixtures/packets.js
// Canonical encoded buffers for E2E tests.
// These are simplified placeholders — replace with actual protobuf-encoded bytes
// generated from proto.json definitions.

export const fixtures = {
  nodeInfo: {
    description: 'Minimal nodeInfo packet',
    raw: Buffer.from([0x0a, 0x03, 0x08, 0x7b, 0x12]), // TODO: replace with real encoding
    expected: {
      type: 'nodeInfo',
      data: {
        num: 123,
        user: { id: 'abc' },
        hwModel: 'TBEAM'
      }
    }
  },

  logRecord: {
    description: 'Minimal logRecord packet',
    raw: Buffer.from([0x12, 0x07, 0x0a, 0x05, 0x48, 0x65, 0x6c, 0x6c, 0x6f]), // "Hello"
    expected: {
      type: 'logRecord',
      data: {
        level: 'INFO',
        message: 'Hello'
      }
    }
  },

  malformed: {
    description: 'Malformed buffer (invalid encoding)',
    raw: Buffer.from([0xff, 0xff, 0xff]),
    expected: null
  }
};
