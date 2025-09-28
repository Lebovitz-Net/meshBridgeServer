// ingestionPipeline.test.js

import { decodeAndNormalize } from '../src/packets/packetDecoders.js';
import { normalizeDecodedPacket } from '../src/packets/packetUtils.js';
import { validateSubPacket } from '../src/router/schemaValidator.js';
import { dispatchSubPacket } from '../src/router/dispatchSubPacket.js';
import { insertHandlers } from '../src/db/insertHandlers.js';
import { emitOverlay } from '../src/overlays/overlayEmitter.js';
import { emitEvent } from '../src/events/eventEmitter.js';
import protoJson from '../src/proto/proto.json' assert { type: 'json' };

// --- Mock side effects
jest.mock('../src/db/insertHandlers.js', () => ({
  insertHandlers: {
    upsertNodeInfo: jest.fn(),
    insertLogRecord: jest.fn(),
  }
}));

jest.mock('../src/overlays/overlayEmitter.js', () => ({
  emitOverlay: jest.fn(),
}));

jest.mock('../src/events/eventEmitter.js', () => ({
  emitEvent: jest.fn(),
}));

describe('Integration: Ingestion Pipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('routes a nodeInfo packet end-to-end', () => {
    // Simulated decoded packet (already buffer-normalized)
    const decoded = {
      sourceType: 'fromRadio',
      nodeInfo: { num: 123, user: { id: 'abc' }, hwModel: 'TBEAM' },
      fromNodeNum: 123,
      connId: 'testConn',
      rxTime: Date.now()
    };

    const subPackets = normalizeDecodedPacket(decoded, protoJson);

    expect(subPackets).toHaveLength(1);
    const subPacket = subPackets[0];

    // Validate schema
    expect(validateSubPacket(subPacket)).toBe(true);

    // Dispatch
    dispatchSubPacket(subPacket);

    // Assertions
    expect(insertHandlers.upsertNodeInfo).toHaveBeenCalledWith(decoded.nodeInfo);
    expect(emitOverlay).toHaveBeenCalledWith('lineage', expect.any(Object));
    expect(emitEvent).toHaveBeenCalledWith('configComplete', expect.any(Object));
  });

  it('routes a logRecord packet end-to-end', () => {
    const decoded = {
      sourceType: 'fromRadio',
      logRecord: { level: 'INFO', message: 'System started' },
      fromNodeNum: 456,
      connId: 'testConn',
      rxTime: Date.now()
    };

    const subPackets = normalizeDecodedPacket(decoded, protoJson);
    expect(subPackets).toHaveLength(1);

    const subPacket = subPackets[0];
    expect(validateSubPacket(subPacket)).toBe(true);

    dispatchSubPacket(subPacket);

    expect(insertHandlers.insertLogRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'INFO',
        message: 'System started',
        num: 456,
        conn_id: 'testConn'
      })
    );
    expect(emitOverlay).toHaveBeenCalledWith('queueHealth', expect.any(Object));
  });

  it('skips invalid subpacket', () => {
    const decoded = {
      sourceType: 'fromRadio',
      nodeInfo: { user: { id: 'abc' } }, // missing num, hwModel
      connId: 'testConn'
    };

    const subPackets = normalizeDecodedPacket(decoded, protoJson);
    const subPacket = subPackets[0];

    expect(validateSubPacket(subPacket)).toBe(false);

    dispatchSubPacket(subPacket);

    // Should not call handlers
    expect(insertHandlers.upsertNodeInfo).not.toHaveBeenCalled();
    expect(emitOverlay).not.toHaveBeenCalled();
    expect(emitEvent).not.toHaveBeenCalled();
  });
});
