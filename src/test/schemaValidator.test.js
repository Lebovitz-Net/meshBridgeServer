// schemaValidator.test.js

import { validateSubPacket } from './schemaValidator.js';

describe('schemaValidator', () => {
  it('validates a correct nodeInfo subpacket', () => {
    const subPacket = {
      type: 'nodeInfo',
      data: {
        num: 123,
        user: { id: 'abc', longName: 'Test Node' },
        hwModel: 'TBEAM'
      }
    };
    expect(validateSubPacket(subPacket)).toBe(true);
  });

  it('rejects nodeInfo missing required fields', () => {
    const subPacket = {
      type: 'nodeInfo',
      data: { user: { id: 'abc' } } // missing num, hwModel
    };
    expect(validateSubPacket(subPacket)).toBe(false);
  });

  it('validates a correct logRecord subpacket', () => {
    const subPacket = {
      type: 'logRecord',
      data: { level: 'INFO', message: 'System started' }
    };
    expect(validateSubPacket(subPacket)).toBe(true);
  });

  it('rejects logRecord missing message', () => {
    const subPacket = {
      type: 'logRecord',
      data: { level: 'ERROR' }
    };
    expect(validateSubPacket(subPacket)).toBe(false);
  });

  it('allows unknown subtype but logs warning', () => {
    const subPacket = {
      type: 'unknownType',
      data: { foo: 'bar' }
    };
    expect(validateSubPacket(subPacket)).toBe(true);
  });

  it('rejects completely malformed subpacket', () => {
    expect(validateSubPacket(null)).toBe(false);
    expect(validateSubPacket({})).toBe(false);
  });
});
