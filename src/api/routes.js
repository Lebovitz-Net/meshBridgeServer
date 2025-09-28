import * as api from './handlers.js';
import { restartServices } from '../utils/servicesManager.js';
import { getNodeIP, setNodeIP } from '../config/config.js';

export function registerRoutes(app) {
  // --- Root ---
  app.get('/', api.health);

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
  app.get('/api/v1/config', api.getConfig);
  app.get('/api/v1/version', api.getVersion);
  app.get('/api/v1/health', api.getHealth);

  // --- Nodes ---
  app.get('/api/v1/nodes', api.listNodesHandler);
  app.get('/api/v1/nodes/:id', api.getNode);
  app.delete('/api/v1/nodes/:id', api.deleteNodeHandler);
  app.get('/api/v1/nodes/:id/channels', api.listChannelsForNode);
  app.get('/api/v1/channels/:id/messages', api.listMessagesForChannel);
  app.get('/api/v1/nodes/:id/connections', api.listConnectionsForNode);

  // --- Packets ---
  app.get('/api/v1/packets', api.listPacketsHandler);
  app.get('/api/v1/packets/:id', api.getPacket);
  app.post('/api/v1/packets', api.injectPacketHandler);

  // --- Metrics (Node-specific) ---
  app.get('/api/v1/nodes/:id/packet-logs', api.getPacketLogs);
  app.get('/api/v1/nodes/:id/telemetry', api.getTelemetry);
  app.get('/api/v1/nodes/:id/events', api.getEvents);

  // --- Metrics (Global) ---
  app.get('/api/v1/metrics', api.getMetrics);

  // --- Diagnostics & Logs ---
  app.get('/api/v1/logs', api.getLogsHandler);

  // --- Control ---
  app.post('/api/v1/restart', api.restartServicesHandler);
  app.post('/api/v1/reload-config', api.reloadConfigHandler);

  // --- Devices ---
  app.get('/api/v1/devices', api.listDevicesHandler);
  app.get('/api/v1/devices/:device_id', api.getDeviceHandler);
  app.get('/api/v1/devices/:device_id/settings/:config_type', api.getDeviceSettingHandler);

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
