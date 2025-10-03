// --- devices.js ---
import queryHandlers from '../db/queryHandlers.js';

const {
  listDevices,
  getDevice,
  getDeviceSetting,
  listDeviceSettings,
} = queryHandlers;

const safe = (fn) => (req, res) => {
  try {
    fn(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- Device Handlers ---
export const listDevicesHandler = safe((req, res) => {
  res.json(listDevices());
});

export const getDeviceHandler = safe((req, res) => {
  const device = getDevice(req.params.device_id);
  if (!device) return res.status(404).json({ error: 'Device not found' });

  const settings = getDeviceSetting(req.params.device_id);
  res.json({ ...device, settings });
});

export const getDeviceSettingHandler = safe((req, res) => {
  const setting = listDeviceSettings(req.params.device_id, req.params.config_type);
  if (!setting) return res.status(404).json({ error: 'Setting not found' });
  res.json(setting);
});
