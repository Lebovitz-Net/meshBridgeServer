import queryHandlers from '../db/queryHandlers.js';
import { insertHandlers } from '../db/insertHandlers.js';
import { meshRequests } from '../handlers/meshtasticRequests.js';

const { listExtendedMessagesForChannel, listMessagesForChannel } = queryHandlers;
const { insertMessage } = insertHandlers;

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
  res.json(listMessagesForChannel(req.params.id));
});

export const listExtendedMessagesForChannelHandler = safe((req, res) => {
  res.json(listExtendedMessagesForChannel(req.params.id));
});

// --- Send Message Handler ---
export async function sendMessageHandler(req, res) {
  try {
    const body = req.body || {};

    if (message == null || typeof message !== 'string') {
      console.warn('[sendMessageHandler] Invalid inputText');
      return res.status(400).json({ error: 'Missing or invalid payload' });
    }

    // ✅ Send via request framework
    meshRequests.sendMessage(body);

    // ✅ Insert outbound message into DB for threading and history
    insertMessage(body);

    return res.status(200).json({
      ok: true,
      ...sendBuf
    });

  } catch (err) {
    console.error('[sendMessageHandler] Error:', err);
    return res.status(500).json({ error: 'Failed to prepare message', details: err.message });
  }
}
