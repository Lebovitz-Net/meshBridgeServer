// handlers/configHandlers.js
import queryHandlers from '../db/queryHandlers.js';

const {
  getFullConfig,
  getConfig,
  listAllConfigs,
  getModuleConfig,
  listAllModuleConfigs,
  getMetadataByKey,
  listAllMetadata,
  listFileInfo
} = queryHandlers;

// Wrap sync handlers for dry-run safety
const safe = (fn) => (req, res) => {
  try {
    fn(req, res);
  } catch (err) {
    console.error('[configHandlers] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- Config ---
export const getFullConfigHandler = safe((req, res) => {
  res.json(getFullConfig());
});

export const getConfigHandler = safe((req, res) => {
  const config = getConfig(req.params.id);
  if (!config) return res.status(404).json({ error: 'Config not found' });
  res.json(config);
});

export const listAllConfigsHandler = safe((req, res) => {
  res.json(listAllConfigs());
});

// --- Module Config ---
export const getModuleConfigHandler = safe((req, res) => {
  const config = getModuleConfig(req.params.id);
  if (!config) return res.status(404).json({ error: 'Module config not found' });
  res.json(config);
});

export const listAllModuleConfigsHandler = safe((req, res) => {
  res.json(listAllModuleConfigs());
});

// --- Metadata ---
export const getMetadataByKeyHandler = safe((req, res) => {
  const meta = getMetadataByKey(req.params.key);
  if (!meta) return res.status(404).json({ error: 'Metadata not found' });
  res.json(meta);
});

export const listAllMetadataHandler = safe((req, res) => {
  res.json(listAllMetadata());
});

// --- File Info ---
export const listFileInfoHandler = safe((req, res) => {
  res.json(listFileInfo());
});
