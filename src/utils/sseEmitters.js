import { broadcastEvent } from '../servers/sse.js'; // or wherever your sseRouter lives

export function emitNodeUpdate(node) {
  const nodeId = node.num || node.device_id || 'unknown';
  broadcastEvent({ type: 'node', node });
}

export function emitChannelUpdate(channel) {
  const channelId = channel.channel_num ?? channel.index ?? 'unknown';
  broadcastEvent({ type: 'channel', channel });
}

export function emitMessageUpdate(message) {
  const messageId = message.messageId ?? 'unknown';
  broadcastEvent({ type: 'message', message });
}
