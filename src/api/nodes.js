// --- nodes.js ---
import queryHandlers from '../db/queryHandlers.js';

const {
  listNodes,
  getNode,
  listChannelsForNode,
  listConnectionsForNode,
  listRecentPacketLogsForNode,
  listTelemetryForNode,
  listEventsForNode,
  getMyInfo,
} = queryHandlers;

import { insertHandlers } from '../db/insertHandlers.js';

// Small helper to wrap sync handlers in try/catch
const safe = (fn) => (req, res) => {
  try {
    fn(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- Node Handlers ---
export const listNodesHandler = safe((req, res) => {
  res.json(listNodes());
});

export const getNodeHandler = safe((req, res) => {
  const node = getNode(req.params.id);
  if (!node) return res.status(404).json({ error: 'Node not found' });
  res.json(node);
});

export const deleteNodeHandler = safe((req, res) => {
  insertHandlers.deleteNode(req.params.id);
  res.json({ success: true });
});

export const listChannels = safe((req, res) => {
  console.log("...ListChannels Handler");
  res.json(listChannelsForNode(req.params.id));
});

export const listConnections = safe((req, res) => {
  res.json(listConnectionsForNode(req.params.id));
});

export const getPacketLogs = safe((req, res) => {
  const limit = parseInt(req.query.limit, 10) || 100;
  res.json(listRecentPacketLogsForNode(req.params.id, limit));
});

export const getTelemetry = safe((req, res) => {
  res.json(listTelemetryForNode(req.params.id));
});

export const getEvents = safe((req, res) => {
  const { type } = req.query;
  res.json(listEventsForNode(req.params.id, type || null));
});

// --- My Info Handler ---
export const listMyInfoHandler = safe(async (req, res) => {
  console.log('...MyInfo Handler');
  const rows = await getMyInfo();
  res.json(rows);
});

