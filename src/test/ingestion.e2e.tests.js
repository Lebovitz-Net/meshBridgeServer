// ingestion.e2e.test.js
import { fixtures } from './fixtures/packets.js';
import { decodeFixture } from './helpers/decodeFixture.js';
import { insertHandlers } from '../src/db/insertHandlers.js';
import { emitOverlay } from '../src/overlays/overlayEmitter.js';
import { emitEvent } from '../src/events/eventEmitter.js';

describe('E2E: Ingestion Pipeline with decodeFixture helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('processes nodeInfo fixture end-to-end', () => {
    const subPackets = decodeFixture(fixtures.nodeInfo.raw, { connId: 'testConn' }, true);

    expect(subPackets[0].type).toBe('nodeInfo');
    expect(insertHandlers.upsertNodeInfo).toHaveBeenCalled();
    expect(emitOverlay).toHaveBeenCalledWith('lineage', expect.any(Object));
    expect(emitEvent).toHaveBeenCalledWith('configComplete', expect.any(Object));
  });

  it('processes logRecord fixture end-to-end', () => {
    const subPackets = decodeFixture(fixtures.logRecord.raw, { connId: 'testConn' }, true);

    expect(subPackets[0].type).toBe('logRecord');
    expect(insertHandlers.insertLogRecord).toHaveBeenCalled();
    expect(emitOverlay).toHaveBeenCalledWith('queueHealth', expect.any(Object));
  });
});
