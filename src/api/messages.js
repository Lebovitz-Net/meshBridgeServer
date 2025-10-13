import protobuf from 'protobufjs';
import protoJson from '../assets/proto.json' with { type: 'json' };
import fs from 'fs/promises';
import queryHandlers from '../db/queryHandlers.js';
import { insertHandlers } from '../db/insertHandlers.js';
import { encodeTextMessage } from '../packets/packetCodecs.js';
import { send } from 'vite';
import { sendToMeshNode } from '../handlers/meshServiceHandler.js';


const { listExtendedMessagesForChannel } = queryHandlers;
const { insertMessage } = insertHandlers;

// Load proto.json once and reuse

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
    console.log('[sendMessageHandler] Preparing to send message:', req.body );
    const body = req.body || {};


    if (body.payload == null || typeof body.payload !== 'string') {
      console.warn('[sendMessageHandler] Invalid inputText');
      return res.status(400).json({ error: 'Missing or invalid payload' });
    }

    const sendBuf = {
      messageId: body.messageId || null,
      channelNum: body.channelNum,
      fromNodeNum: body.fromNodeNum || null,
      toNodeNum: body.toNodeNum || 4294967295, // Broadcast by default
      payload: body.payload,
      wantAck: true,
      wantReply: false,
      replyId: null,
      timestamp: Date.now()
    };
    const encoded = encodeTextMessage(sendBuf);
    sendToMeshNode(encoded);

    // // ✅ Insert outbound message into DB for threading and history
    insertMessage (sendBuf);

    return res.status(200).json({
      ok: true,
      ...sendBuf
    });

  } catch (err) {
    console.error('[sendMessageHandler] Error:', err);
    return res.status(500).json({ error: 'Failed to prepare message', details: err.message });
  }
}
