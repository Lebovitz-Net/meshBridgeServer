import {
  // Nodes
  listNodes,
  getNodeByNum,
  getChannelsForNode,
  getMessagesForChannel,
  getConnectionsForNode,
  // Packets
  listPacketLogs,
  getPacketLogById,
  // Metrics
  getRecentPacketLogsForNode,
  getTelemetryForNode,
  getEventsForNode,
  getGlobalVoltageStats,
  // Logs
  getLogs,
  // Control
  getFullConfig,
  // Devices
  listDevices,
  getDeviceById,
  getDeviceSettings,
  getDeviceSettingByType
} from '../db/queryHandlers.js';

import { insertHandlers } from '../db/insertHandlers.js';

import { config } from '../config/config.js';

// Small helper to wrap sync handlers in try/catch
const safe = (fn) => (req, res) => {
  try {
    fn(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- Root/System ---
export const health = safe((req, res) => {
  res.send('MeshManager v2 is running');
});

export const getConfig = safe((req, res) => {
  res.json(config);
});

export const getVersion = safe((req, res) => {
  res.json({ version: '1.0.0', buildDate: new Date().toISOString() });
});

export const getHealth = safe((req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// --- Nodes ---
export const listNodesHandler = safe((req, res) => {
  res.json(listNodes());
});

export const getNode = safe((req, res) => {
  const node = getNodeByNum(req.params.id);
  if (!node) return res.status(404).json({ error: 'Node not found' });
  res.json(node);
});

export const deleteNodeHandler = safe((req, res) => {
  insertHandlers.deleteNode(req.params.id);
  res.json({ success: true });
});

export const listChannelsForNode = safe((req, res) => {
  res.json(getChannelsForNode(req.params.id));
});

export const listMessagesForChannel = safe((req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  res.json(getMessagesForChannel(req.params.id, limit));
});

export const listConnectionsForNode = safe((req, res) => {
  res.json(getConnectionsForNode(req.params.id));
});

// --- Packets ---
export const listPacketsHandler = safe((req, res) => {
  const limit = parseInt(req.query.limit, 10) || 100;
  res.json(listPacketLogs(limit));
});

export const getPacket = safe((req, res) => {
  const pkt = getPacketLogById(req.params.id);
  if (!pkt) return res.status(404).json({ error: 'Packet not found' });
  res.json(pkt);
});

export const injectPacketHandler = safe((req, res) => {
  const result = insertHandlers.injectPacketLog(req.body);
  res.json({ success: true, result });
});

// --- Metrics ---
export const getPacketLogs = safe((req, res) => {
  const limit = parseInt(req.query.limit, 10) || 100;
  res.json(getRecentPacketLogsForNode(req.params.id, limit));
});

export const getTelemetry = safe((req, res) => {
  res.json(getTelemetryForNode(req.params.id));
});

export const getEvents = safe((req, res) => {
  const { type } = req.query;
  res.json(getEventsForNode(req.params.id, type || null));
});

export const getMetrics = safe((req, res) => {
  res.json(getGlobalVoltageStats());
});

// --- Logs ---
export const getLogsHandler = safe((req, res) => {
  const limit = parseInt(req.query.limit, 10) || 200;
  res.json(getLogs(limit));
});

// --- Control ---
export const restartServicesHandler = safe((req, res) => {
  res.json(restartServices());
});

export const reloadConfigHandler = safe((req, res) => {
  res.json(getFullConfig());
});

// --- Devices ---
export const listDevicesHandler = safe((req, res) => {
  res.json(listDevices());
});

export const getDeviceHandler = safe((req, res) => {
  const device = getDeviceById(req.params.device_id);
  if (!device) return res.status(404).json({ error: 'Device not found' });

  const settings = getDeviceSettings(req.params.device_id);
  res.json({ ...device, settings });
});

export const getDeviceSettingHandler = safe((req, res) => {
  const setting = getDeviceSettingByType(req.params.device_id, req.params.config_type);
  if (!setting) return res.status(404).json({ error: 'Setting not found' });
  res.json(setting);
});


