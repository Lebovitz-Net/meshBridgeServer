import queryHandlers from '../db/queryHandlers.js';
const { listMessagesForChannel } = queryHandlers;

// Small helper to wrap sync handlers in try/catch
const safe = (fn) => (req, res) => {
  try {
    fn(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- Messages Handler ---
export const listMessagesForChannelHandler = safe((req, res) => {
  console.log('...listMessagesForChannel', req.params.id);
  res.json(listMessagesForChannel(req.params.id));
});
