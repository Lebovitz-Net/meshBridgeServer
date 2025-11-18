import queryHandlers from '../db/queryHandlers.js';
import { insertHandlers } from '../db/insertHandlers.js';

const {
    listContacts,
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
export const listContactsHandler = safe((req, res) => {
  res.json(listContacts());
});