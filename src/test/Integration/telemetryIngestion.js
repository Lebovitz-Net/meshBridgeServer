// test/integration/telemetryIngestion.test.js

import { routePacket } from '../../core/ingestionRouter.js';
import { fromRadioTelemetryFixture } from '../fixtures/fromRadioTelemetry.js';

describe('Telemetry ingestion pipeline', () => {
  it('should decode, dispatch, and insert telemetry metrics', () => {
    const meta = { sourceIp: '192.168.1.50', connId: 'test-conn' };

    // Route the fixture through the ingestion pipeline
    routePacket(fromRadioTelemetryFixture, meta);

    // Assertions:
    // - Check DB tables for inserted rows (device_metrics, environment_metrics, etc.)
    // - Check overlays/events emitted (mock emitOverlay/emitEvent)
    // Example (pseudo-code):
    // expect(db.query('SELECT * FROM device_metrics')).toHaveLength(1);
    // expect(overlayEmitter.lastEvent).toEqual(expect.objectContaining({ type: 'telemetry' }));
  });
});
