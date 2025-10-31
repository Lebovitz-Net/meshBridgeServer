import { insertHandlers } from '../../db/insertHandlers.js';
import { emitOverlay } from '../../overlays/overlayEmitter.js';
import { emitEvent } from '../../events/eventEmitter.js';
import { decodeNodeInfo } from '../utils/stringUtils.js';

export const dispatchMessages = {
  message: (subPacket) => {
  
    const { packet, meta } = subPacket;
    const { fromNodeNum, toNodeNum, device_id, timestamp, connId } = meta;
    const data = packet.data;
    const message = data.decoded?.payload;

    insertHandlers.insertMessage({
      message,
      messageId: data.id,
      fromNodeNum,
      toNodeNum,
      device_id,
      connId,
      timestamp,
      channelId: meta.channel ?? 0,
      replyId: data.replyId ?? 0,
      wantReply: data.wantReply ? 1 : 0,
      wantAck: data.wantAck ? 1 : 0,
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
