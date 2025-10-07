// --- control.js ---
import { restartServices } from '../utils/servicesManager.js';

const safe = (fn) => (req, res) => {
  try {
    fn(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- Control Handlers ---
export const restartServicesHandler = safe((req, res) => {
  const result = restartServices();
  res.json(result);
});
