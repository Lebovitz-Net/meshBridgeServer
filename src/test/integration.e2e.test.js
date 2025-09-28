// ingestion.e2e.test.js
import { fixtures } from './fixtures/packets.js';

it('processes a nodeInfo packet end-to-end', () => {
  const { raw, expected } = fixtures.nodeInfo;
  const decoded = decodeAndNormalize(raw, 'testConn', '127.0.0.1');
  const subPackets = normalizeDecodedPacket(decoded, protoJson);

  expect(subPackets[0].type).toBe(expected.type);
  expect(validateSubPacket(subPackets[0])).toBe(true);

  dispatchSubPacket(subPackets[0]);

  expect(insertHandlers.upsertNodeInfo).toHaveBeenCalledWith(expect.any(Object));
});
