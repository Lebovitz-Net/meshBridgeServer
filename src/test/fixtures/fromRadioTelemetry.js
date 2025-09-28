// test/fixtures/fromRadioTelemetry.js
import protobuf from 'protobufjs';
import protoJson from '../assets/proto.json' with { type: 'json' };

// Build protobuf root from your compiled JSON
const root = protobuf.Root.fromJSON(protoJson);
const Telemetry = root.lookupType('meshtastic.Telemetry');

export function buildTelemetryFixture() {
  // Construct a valid Telemetry message
  const telemetryPayload = Telemetry.create({
    voltage: 4.1,
    channelUtilization: 0.12,
    airUtilTx: 0.05,
    deviceMetrics: {
      batteryLevel: 87,
      txPower: 20,
      uptimeSeconds: 123456,
      cpuTemperature: 42.5,
      memoryUtilization: 0.65,
    },
    environmentMetrics: {
      temperature: 22.3,
      relativeHumidity: 55,
      barometricPressure: 1013,
      light: 300,
    },
  });

  // Encode into a Buffer
  const payloadBuffer = Telemetry.encode(telemetryPayload).finish();

  // Wrap in a MeshPacket inside a FromRadio
  return {
    meshPacket: {
      id: 123456789,
      from: 101,
      to: 0,
      rxTime: Math.floor(Date.now() / 1000),
      viaMqtt: false,
      hopStart: 3,
      decoded: {
        portnum: 67, // Telemetry
        payload: payloadBuffer,
      },
    },
  };
}
