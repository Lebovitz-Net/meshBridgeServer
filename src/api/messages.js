import queryHandlers from '../db/queryHandlers.js';
import { insertHandlers } from '../db/insertHandlers.js';
import { MeshcoreRequests } from '../handlers/meshcoreRequests.js';
import { safe, generateMessageId } from './apiUtils.js';

const { listMessages } = queryHandlers;// ✅ add this in queryHandlers if not already
const { insertMessage } = insertHandlers;


// --- Unified Messages Handler ---
// --- Unified Messages Handler ---
export const listMessagesHandler = safe((req, res) => {
  try {
    const channelId = req.query.channelId ? Number(req.query.channelId) : null;
    const sinceDate = req.query.sinceDate ? Number(req.query.sinceDate) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : null;

    // single query function that handles filters
    const messages = listMessages({ channelId, sinceDate, limit });

    console.log('[listMessagesHandler] returning', messages.length, 'messages');
    res.json(messages);
  } catch (err) {
    console.error('[listMessagesHandler] Error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});


// --- Send Message Handler ---
export async function sendMessageHandler(req, res) {
  try {
    const body = req.body || {};
    const {
            message, channelId, sender, protocol, mentions, options,
            recvTimestamp, sentTimestamp, toNodeNum, fromNodeNum,
     } = body;
     const request = MeshcoreRequests.getInstance();


    if (!message || typeof message !== 'string') {
      console.warn('[sendMessageHandler] Invalid inputText');
      return res.status(400).json({ error: 'Missing or invalid payload' });
    }
    console.log('.../sendMessageHandler', body, generateMessageId(body));
    // ✅ Send via request framework
    await request.sendChannelTextMessage(channelId, message );


    const shaped = {
        contactId: sender,
        messageId: generateMessageId(body),
        channelId,
        fromNodeNum,
        toNodeNum,
        message: `${sender}: ${message}`,
        recvTimestamp,
        sentTimestamp,
        protocol,
        sender,
        mentions,
        options,
    };

    // ✅ Insert outbound message into DB for threading and history
    const inserted = insertMessage(shaped);

    return res.status(200).json({
      ok: true,
      message: inserted,
    });
  } catch (err) {
    console.error('[sendMessageHandler] Error:', err);
    return res.status(500).json({
      error: 'Failed to prepare message',
      details: err.message,
    });
  }
}
