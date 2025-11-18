import { getTextFromKey } from '../packetUtils.js';
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
const extractSenderAndMentions = (msg) => {
  const splitIndex = msg.indexOf(':');
  if (splitIndex === -1) {
    return { sender:null, message: msg, mentions: null};
  }

  const sender  = msg.slice(0, splitIndex).trim().toLowerCase();
  const message = msg.slice(splitIndex + 1).trim();

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
        const { text, txtType, pathLen } = data;
        const { sender, mentions } = extractSenderAndMentions(text);

        if (sender == null) {
            console.warn ('[dispatchMessage] skipping Message cannot extract sender', msg);
            return;
        }

        console.log('.../dispatchMessages Channel Message is', text, sender);

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

        insertMessage(shaped);
    },
    NoMoreMessages: (packet) => {
        console.log('.../dispatchMessages NoMoreMessages');
    },
    ContactMsgReceived: (packet) => {
        console.log('.../dispatchMessages ContactMsgRev', packet);
    }
}
