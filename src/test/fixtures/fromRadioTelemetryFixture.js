// test/fixtures/fromRadioTelemetry.js

export const fromRadioTelemetryFixture = {
  // This mimics a decoded FromRadio protobuf message
  meshPacket: {
    id: 123456789,
    from: 101,          // nodeNum of sender
    to: 0,              // broadcast
    rxTime: Math.floor(Date.now() / 1000),
    viaMqtt: false,
    hopStart: 3,
    decoded: {
      portnum: 67,      // Telemetry
      payload: Buffer.from(
        // Example Telemetry protobuf payload (pretend encoded)
        // In a real test, this should be a valid protobuf-encoded Telemetry message
        // For now, we simulate with JSON-like structure
        JSON.stringify({
          voltage: 4.1,
          channelUtilization: 0.12,
          airUtilTx: 0.05,
          deviceMetrics: {
            batteryLevel: 87,
            txPower: 20,
            uptime: 123456,
            cpuTemp: 42.5,
            memoryUsage: 0.65,
          },
          environmentMetrics: {
            temperature: 22.3,
            humidity: 55,
            pressure: 1013,
            lightLevel: 300,
          },
        })
      ),
    },
  },
};
