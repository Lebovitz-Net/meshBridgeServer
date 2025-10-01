// --- system.js ---
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

// --- System & Runtime Config Handlers ---
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
