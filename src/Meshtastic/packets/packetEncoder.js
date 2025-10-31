import protobuf from 'protobufjs';
import { getProtobufs, getDecodeTypes } from '../utils/protoUtils.js';

/**
 * Encode a ToRadio protobuf message with framing header.
 * @param {object} obj - Fields for meshtastic.ToRadio
 * @returns {Buffer}
 */
export function encodeToRadio(obj) {
  const toRadio = getProtobufs('ToRadio');
  if (!toRadio) throw new Error('Protobuf types not initialized — call initProtoTypes() first');
  const err = toRadio.verify(obj);
  if (err) throw new Error(err);
  const packet = toRadio.create(obj);
  const buffer = toRadio.encode(packet).finish();
  return Buffer.concat([Buffer.from([0x94, 0xc3]), buffer]);
}

export function encodeTextMessage(data) {
  const { fromNodeNum, toNodeNum, messageId, channelNum, message, wantAck = true } = data;
  const Data = getProtobufs('Data');
  const dataPayload = Data.create({
      portnum: 1,
      payload: Buffer.from(message),
      bitfield: 1,
  });
  const MeshPacket = getProtobufs('MeshPacket');
  const meshPacketPayload = MeshPacket.create({
    from: fromNodeNum,
    to: toNodeNum,
    id: messageId,
    channel: channelNum,
    wantAck,
    decoded: dataPayload,
    priority: 1,
    hopLimit:  7
  });
  const encoded = encodeToRadio({ packet: meshPacketPayload });
  return encoded;
}
