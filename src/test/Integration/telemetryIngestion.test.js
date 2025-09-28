// test/integration/telemetryIngestion.test.js
// bridge/test/integration/telemetryIngestion.test.js
import { routePacket } from '../../core/ingestionRouter.js';
import { buildTelemetryFixture } from '../fixtures/fromRadioTelemetry.js';
import * as overlayEmitter from '../../overlays/overlayEmitter.js';

// If you’re mocking insertHandlers instead of hitting a DB:
import { insertHandlers } from '../../db/insertHandlers.js';
jest.mock('../../db/insertHandlers.js');


describe('Telemetry ingestion pipeline', () => {
  beforeAll(async () => {
    await db.migrate.latest(); // run schema migrations
  });

  beforeEach(async () => {
    await db.truncateAll(); // clear tables between tests
    overlayEmitter.__reset && overlayEmitter.__reset(); // if you add a reset helper
  });

  it('should decode, dispatch, and insert telemetry metrics', async () => {
    const fixture = buildTelemetryFixture();
    const meta = { sourceIp: '192.168.1.50', connId: 'test-conn' };

    // Route the fixture through the ingestion pipeline
    routePacket(fixture, meta);

    // Query DB for inserted metrics
    const deviceMetrics = await db.query('SELECT * FROM device_metrics');
    const envMetrics = await db.query('SELECT * FROM environment_metrics');

    expect(deviceMetrics).toHaveLength(1);
    expect(envMetrics).toHaveLength(1);

    // Assert overlay emission
    // You can spy on overlayEmitter.subscribeOverlay
    let lastOverlay;
    overlayEmitter.subscribeOverlay((eventType, payload) => {
      lastOverlay = { eventType, payload };
    });

    // Re-run to trigger overlay
    routePacket(fixture, meta);

    expect(lastOverlay.eventType).toBe('telemetry');
    expect(lastOverlay.payload.data.voltage).toBeCloseTo(4.1);
  });
});
