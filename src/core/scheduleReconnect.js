export const scheduleReconnect = (connId, host, port, tcpConnections, openTCPConnection) => {
  const entry = tcpConnections.get(connId);
  if (!entry || entry.reconnectTimer) return;

  entry.reconnectTimer = setTimeout(() => {
    entry.reconnectTimer = null;
    openTCPConnection(connId, host, port);
  }, 3000);
};
