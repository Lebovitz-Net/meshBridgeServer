export function routeFromRadio(decodedPacket, context) {
  const { connId, source } = context;

  if (decodedPacket.config) return handleConfig(decodedPacket.config, connId);
  if (decodedPacket.moduleConfig) return handleModuleConfig(decodedPacket.moduleConfig, connId);
  if (decodedPacket.metadata) return handleDeviceMetadata(decodedPacket.metadata, connId);
  if (decodedPacket.text) return handleTextMessage(decodedPacket.text, connId);
  if (decodedPacket.position) return handlePosition(decodedPacket.position, connId);
  if (decodedPacket.telemetry) return handleTelemetry(decodedPacket.telemetry, connId);

  emitDiagnostic('unhandled_packet', { connId, source, portnum: decodedPacket.portnum });
}
