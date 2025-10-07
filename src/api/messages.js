import protobuf from 'protobufjs';
import protoJson from '../assets/proto.json' with { type: 'json' };
import fs from 'fs/promises';
import queryHandlers from '../db/queryHandlers.js';
const { listMessagesForChannel, insertMessage } = queryHandlers;
import { sendToMeshNode } from '../handlers/meshServiceHandler.js';

// Load proto.json once and reuse
const root = protobuf.Root.fromJSON(protoJson);
const MeshPacket = root.lookupType('meshtastic.MeshPacket');
const ToRadio = root.lookupType('meshtastic.ToRadio');

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

// --- Send Message Handler ---
export async function sendMessageHandler(req, res) {
  try {
    const {
      messageId,
      channelNum,
      fromNodeNum,
      toNodeNum,
      payload,
      wantAck = true,
      wantReply = false,
      replyId = null
    } = req.body;

    console.log('...messages payload', req.body);

    if (!payload || typeof payload !== 'string') {
      console.warn('[sendMessageHandler] Invalid inputText');
      return res.status(400).json({ error: 'Missing or invalid payload' });
    }

    const timestamp = Date.now();
    const encodedText = Buffer.from(payload);

    const meshPacketPayload = MeshPacket.create({
      from: fromNodeNum,
      to: toNodeNum,
      id: messageId,
      channel: channelNum,
      wantAck,
      priority: 1,
      decoded: {
        portnum: 1,
        payload: encodedText,
        bitfield: 1,
      }
    });

    sendToMeshNode({ packet: meshPacketPayload });

    // ✅ Insert outbound message into DB for threading and history
    insertMessage({
      message_id: messageId,
      channel: channelNum,
      fromNodeNum,
      toNodeNum,
      message: payload,
      wantAck,
      wantReply,
      replyId,
      timestamp
    });

    return res.status(200).json({
      ok: true,
      messageId,
      fromNodeNum,
      toNodeNum,
      channelNum,
      payload,
      timestamp
    });

  } catch (err) {
    console.error('[sendMessageHandler] Error:', err);
    return res.status(500).json({ error: 'Failed to prepare message', details: err.message });
  }
}
