import { insertHandlers } from '../../db/insertHandlers.js';
import { emitOverlay } from '../../overlays/overlayEmitter.js';
import { emitEvent } from '../../events/eventEmitter.js';
import { decodeNodeInfo } from '../utils/stringUtils.js';

export const dispatchMessages = {
  message: (subPacket) => {
  
    const { packet, meta } = subPacket;
    const { fromNodeNum, toNodeNum, channel, timestamp, connId } = meta;
    const data = packet.data;
    const { id, decoded, replyId, wantReply, wantAck } = data;
    const message = decoded?.payload;

    insertHandlers.insertMessage({
      contactId: fromNodeNum.toString(),
      messageId: id,
      channelId: channel ?? 0,
      message,
      fromNodeNum,
      toNodeNum,
      timestamp,
      protocol: 'Meshtastic',
      sender: replyId ?? null,
      options: JSON.stringify({ replyId, wantReply, wantAck }),
      connId
    });

    emitOverlay('message', subPacket);
    emitEvent('messageReceived', subPacket);
    console.log('[dispatchMessages] message');
  },

  Message: (subPacket) => {
    console.log('[dispatchMessage] Message', subPacket);
  },

  text: (subPacket) => {
    const  { data, meta } = subPacket;
    console.log('[dispatchMessage] text', subPacket, decodeNodeInfo(data.topic));
  },

  ClientNotification: (subPacket) => {
    console.log('[dispatchMessage] ClientNotification');

  },

  clientNotification: (subPacket) => {
    console.log('[dispatchMessage] clientNotification');

  },
}
