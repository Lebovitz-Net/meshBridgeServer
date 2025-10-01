import express from 'express';
import queryHandlers from '../db/queries/queryHandlers.js';

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

const router = express.Router();

// --- Config APIs ---
router.get('/config/full', (req, res) => {
  res.json(getFullConfig());
});

router.get('/config/:id', (req, res) => {
  const config = getConfig(req.params.id);
  if (!config) return res.status(404).json({ error: 'Config not found' });
  res.json(config);
});

router.get('/configs', (req, res) => {
  res.json(listAllConfigs());
});

// --- Module Config APIs ---
router.get('/module-config/:id', (req, res) => {
  const config = getModuleConfig(req.params.id);
  if (!config) return res.status(404).json({ error: 'Module config not found' });
  res.json(config);
});

router.get('/module-configs', (req, res) => {
  res.json(listAllModuleConfigs());
});

// --- Metadata APIs ---
router.get('/metadata/:key', (req, res) => {
  const meta = getMetadataByKey(req.params.key);
  if (!meta) return res.status(404).json({ error: 'Metadata not found' });
  res.json(meta);
});

router.get('/metadata', (req, res) => {
  res.json(listAllMetadata());
});

// --- File Info APIs ---
router.get('/files', (req, res) => {
  res.json(listFileInfo());
});

export default router;
