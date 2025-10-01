// --- diagnostics.js ---
import queryHandlers from '../db/queries/queryHandlers.js';

const {
  listLogs,
  getFullConfig,
  listPacketLogs,
  getPacketLogById
} = queryHandlers;

const safe = (fn) => (req, res) => {
  try {
    fn(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- Diagnostics Handlers ---
export const getLogsHandler = safe((req, res) => {
  const limit = parseInt(req.query.limit, 10) || 200;
  res.json(listLogs(limit));
});

export const reloadConfigHandler = safe((req, res) => {
  res.json(getFullConfig());
});


// --- Packet Handlers ---
export const listPacketsHandler = safe((req, res) => {
  const limit = parseInt(req.query.limit, 10) || 100;
  res.json(listPacketLogs(limit));
});

export const getPacketHandler = safe((req, res) => {
  const pkt = getPacketLogById(req.params.id);
  if (!pkt) return res.status(404).json({ error: 'Packet not found' });
  res.json(pkt);
});

export const injectPacketHandler = safe((req, res) => {
  const result = insertHandlers.injectPacketLog(req.body);
  res.json({ success: true, result });
});
