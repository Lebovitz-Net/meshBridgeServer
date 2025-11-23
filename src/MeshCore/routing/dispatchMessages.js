import { getTextFromKey } from '../packetUtils.js';
import { insertHandlers } from '../../db/insertHandlers.js';
import { MeshcoreRequests } from '../../handlers/meshcoreRequests.js';
import { normalizeIn } from '../../utils.js';
import { generateMessageId, extractSenderAndMentions } from '../../api/apiUtils.js';

const { insertMessage } = insertHandlers;

export const dispatchMessages = {

    Sent: (packet) => {
        console.log('.../dispatchMessages sent', packet);
    },
    MsgWaiting: (packet)  => {
        console.log('.../dispatchMessages MsgWaiting', packet);
        const request = MeshcoreRequests.getInstance();
        request.getWaitingMessages();
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
            sentTimestamp: normalizeIn(data.senderTimestamp),
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
