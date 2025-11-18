import queryHandlers from '../db/queryHandlers.js';
import { insertHandlers } from '../db/insertHandlers.js';
import { getMeshRuntime } from '../handlers/meshcoreRequests.js';
import { MeshcoreCommandQueue } from '../MeshCore/meshcoreCommandQueue.js';
import { safe } from './apiUtils.js';

const {
  listExtendedMessagesForChannel,
  listMessagesForChannel,
  listAllMessages // ✅ add this in queryHandlers if not already
} = queryHandlers;
const { insertMessage } = insertHandlers;


// --- Unified Messages Handler ---
export const listMessagesHandler = safe((req, res) => {
  // ✅ Return all messages across channels
  const messages = listAllMessages ? listAllMessages() : [];
  res.json(messages);
});

// --- Channel‑Scoped Handlers (legacy support) ---
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
    const { message, channelId } = body;
    const meshcore =  getMeshRuntime();
    const request = meshcore.request;

    if (!message || typeof message !== 'string') {
      console.warn('[sendMessageHandler] Invalid inputText');
      return res.status(400).json({ error: 'Missing or invalid payload' });
    }
    console.log('.../sendMessageHandler', body);
    // ✅ Send via request framework
    await request.sendChannelTextMessage(channelId, message );


    const shaped = {
        contactId: sender,
        messageId: generateMessageId(packet),
        channelId: data.channelIdx ?? 'default',
        fromNodeNum: data.from ?? 0,
        toNodeNum: data.to ?? null,
        message: text,
        recvTimestamp: meta.timestamp,
        sentTimestamp: data.senderTimestamp,
        protocol: 'meshcore',
        sender,
        mentions: JSON.stringify(mentions),
        options:  JSON.stringify({ txtType, pathLen }),
    };




    // ✅ Insert outbound message into DB for threading and history
    const inserted = insertMessage(body);

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
