// routes/configRoutes.js
import express from 'express';
import { getNodeIP, setNodeIP } from '../config/config.js';

const router = express.Router();

/**
 * GET current node IP
 */
router.get('/node-ip', (req, res) => {
  res.json({ ip: getNodeIP() });
});

/**
 * POST new node IP
 * Body: { ip: "192.168.1.99:4403" }
 */
router.post('/node-ip', (req, res) => {
  const { ip } = req.body;
  if (!ip || typeof ip !== 'string' || !ip.includes(':')) {
    return res.status(400).json({ error: 'Invalid IP format. Expected "host:port".' });
  }

  setNodeIP(ip);
  res.json({ success: true, ip });
});

export default router;
