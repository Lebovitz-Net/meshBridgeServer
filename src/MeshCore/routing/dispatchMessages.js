import { getTextFromKey } from '../repeaterContacts.js';
import { insertMessage } from '../../db/inserts/messageInserts.js';
import { getTypeName } from './dispatchPacket.js';
import crypto from 'crypto';

/**
 * Generates a unique message ID based on key packet fields.
 * Ensures reproducibility and avoids collisions across protocols.
 */
export const generateMessageId = (packet) => {
  const base = [
    packet.protocol ?? 'meshcore',
    packet.from ?? 0,
    packet.channel ?? 'default',
    packet.timestamp ?? Date.now(),
    packet.payload?.text ?? ''
  ].join('|');

  return crypto.createHash('sha256').update(base).digest('hex').slice(0, 16); // 16-char ID
};

// --- Utility: Extract sender and mentions from message string ---
const extractSenderAndMentions = (raw) => {
  const splitIndex = raw.indexOf(':');
  const sender = splitIndex !== -1 ? raw.slice(0, splitIndex).trim().toLowerCase() : null;
  const message = splitIndex !== -1 ? raw.slice(splitIndex + 1).trim() : raw;

  const mentionMatches = [...message.matchAll(/@(\w+)/g)].map(m => m[1].toLowerCase());
  const mentions = [...new Set(mentionMatches)];

  return { sender, message, mentions };
};

export const dispatchMessages = {

    Sent: (packet) => {
        console.log('.../dispatchMessages sent', packet);
    },
    MsgWaiting: (packet) => {
        console.log('.../dispatchMessages MsgWaiting', packet);
    },
    Advert: (packet) => {
        const key = packet.data?.data?.publicKey;
        console.log('.../dispatchMessages Advert key is', getTextFromKey(key));
    },
    ChannelMsgRecv: (packet) => {

        const { data, meta } = packet.data
        const rawText = data.text ?? '';
        const { sender, mentions } = extractSenderAndMentions(rawText);
        console.log('.../dispatchMessages Channel Message is', rawText);


        const shaped = {
            messageId: generateMessageId(packet),
            channelId: data.channelIdx ?? 'default',
            fromNodeNum: data.from ?? 0,
            toNodeNum: data.to ?? null,
            message: rawText,
            recvTimestamp: meta.timestamp ?? Date.now(),
            sentTimestamp: data.senderTimestamp,
            protocol: 'meshcore',
            sender,
            mentions,
            options: { type: data.txtType, pathLen: data.pathLen },
        };

        insertMessage(shaped);
    },
    NoMoreMessages: (packet) => {
        console.log('.../dispatchMessages NoMoreMessages');
    },
    ContactMsgReceived: (packet) => {
        console.log('.../dispatchMessages ContactMsgRev', packet);
    }
}
