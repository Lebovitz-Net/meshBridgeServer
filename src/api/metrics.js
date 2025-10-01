// --- metrics.js ---
import queryHandlers from '../db/queries/queryHandlers.js';
const {
  listTelemetryForNode,
  listEventsForNode,
  getVoltageStats
} = queryHandlers;

// Small helper to wrap sync handlers in try/catch
const safe = (fn) => (req, res) => {
  try {
    fn(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- Metrics Handlers ---
export const getTelemetry = safe((req, res) => {
  res.json(listTelemetryForNode(req.params.id));
});

export const getEvents = safe((req, res) => {
  const { type } = req.query;
  res.json(listEventsForNode(req.params.id, type || null));
});

export const getMetrics = safe((req, res) => {
  res.json(getVoltageStats());
});
