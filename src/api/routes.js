import api from './handlers.js';
import { restartServices } from '../utils/servicesManager.js';
import { getNodeIP, setNodeIP } from '../config/config.js';

const {
  health,
  getConfig,
  getVersion,
  getHealth,
  listNodesHandler,
  getNodeHandler,
  deleteNodeHandler,
  listChannels,
  listMessagesForChannelHandler,
  sendMessageHandler,
  listConnections,
  listPacketsHandler,
  getPacketHandler,
  injectPacketHandler,
  getPacketLogs,
  getTelemetry,
  getEvents,
  getMetrics,
  getLogsHandler,
  restartServicesHandler,
  reloadConfigHandler,
  listDevicesHandler,
  getDeviceHandler,
  getDeviceSettingHandler,
  listMyInfoHandler,
} = api;

export function registerRoutes(app) {

  // --- Root ---
  app.get('/', health);

  // --- Runtime Config ---
  app.get('/api/v1/node-ip', (req, res) => res.json({ ip: getNodeIP() }));
  app.post('/api/v1/node-ip', (req, res) => {
    const { ip } = req.body;
    if (!ip || typeof ip !== 'string' || !ip.includes(':')) {
      return res.status(400).json({ error: 'Invalid IP format. Expected "host:port".' });
    }
    setNodeIP(ip);
    res.json({ success: true, ip });
  });

  // --- System ---
  app.get('/api/v1/config', getConfig);
  app.get('/api/v1/version', getVersion);
  app.get('/api/v1/health', getHealth);

  // --- Nodes ---
  app.get('/api/v1/nodes/:id/connections', listConnections);
  app.get('/api/v1/nodes/:id', getNodeHandler);
  app.delete('/api/v1/nodes/:id', deleteNodeHandler);
  app.get('/api/v1/nodes', listNodesHandler);
  app.get('/api/v1/channels/:id/messages', listMessagesForChannelHandler);  
  app.get('/api/v1/channels/:id', listChannels);

  app.get('/api/v1/myinfo', listMyInfoHandler);

  // --- Packets ---
  app.get('/api/v1/packets', listPacketsHandler);
  app.get('/api/v1/packets/:id', getPacketHandler);
  app.post('/api/v1/packets', injectPacketHandler);

  // --- Metrics (Node-specific) ---
  app.get('/api/v1/nodes/:id/packet-logs', getPacketLogs);
  app.get('/api/v1/nodes/:id/telemetry', getTelemetry);
  app.get('/api/v1/nodes/:id/events', getEvents);
  app.post('/api/v1/sendMessage', sendMessageHandler);


  // --- Metrics (Global) ---
  app.get('/api/v1/metrics', getMetrics);

  // --- Diagnostics & Logs ---
  app.get('/api/v1/logs', getLogsHandler);

  // --- Control ---
  app.post('/api/v1/restart', restartServicesHandler);
  app.post('/api/v1/reload-config', reloadConfigHandler);

  // --- Devices ---
  app.get('/api/v1/devices', listDevicesHandler);
  app.get('/api/v1/devices/:device_id', getDeviceHandler);
  app.get('/api/v1/devices/:device_id/settings/:config_type', getDeviceSettingHandler);

  app.post('/api/v1/services/restart', async (req, res) => {
    try {
      const result = await restartServices();
      res.json(result);
    } catch (err) {
      console.error('[restart] Failed:', err);
      res.status(500).json({ error: 'Restart failed' });
    }
  });
};
