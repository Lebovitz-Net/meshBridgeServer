import { insertHandlers } from '../db/insertHandlers.js';
import { emitOverlay } from '../overlays/overlayEmitter.js';
import { emitEvent } from '../events/eventEmitter.js';
import { validateUserPacket }  from '../utils/validators.js';
import { decodeNodeInfo } from '../utils/stringUtils.js';
import { currentIPHost } from '../config/config.js';

const dissectString = (str) => {
  const buffer = Buffer.from(str);
  console.log('.../dispatchNodes string', buffer);
}
 
export const dispatchNodes = {
  MyNodeInfo: (subPacket) => {
    console.log('.../MyNodeInfo ');
  },

  myInfo: (subPacket) => {
      const { data, connId, timestamp, meta } = subPacket;
      const { myInfo } = data;
      console.log('.../myNodeInfo ');

      const result = insertHandlers.insertMyInfo({
        ...myInfo,
        connId,
        currentIP: meta.sourceIp,
        timestamp: timestamp || meta.timestamp,
      });
  },

  NodeFilter: (subPacket) => {
    const { data, meta } = subPacket;
    
    console.log('[dispatchNodes] ... NodeFilter', subPacket, decodeNodeInfo(data.nodeName));
  },

  NodeHighlight: (subPacket) => {
    console.log('[dispatchNodes] ... NodeHighlight', subPacket);
  },

  NodeInfo: (subPacket) => {
    console.log('[dispatchNodes] ... NodeInfo', subPacket);
  },

  nodeInfo: (subPacket) => {
    const { data, meta } = subPacket;
    const { connId, timestamp, device_id } = meta;
    const { nodeInfo } = data;

    const result = insertHandlers.upsertNodeInfo({
      ...meta,
      ...nodeInfo,
      num: nodeInfo?.num || nodeInfo?.fromNodeNum || meta?.fromNodeNum,
      connId,
      timestamp,
      device_id: device_id || meta.device_id || null,
    });

    if (result?.num) subPacket.fromNodeNum = result.num;
    if (result?.device_id) subPacket.device_id = result.device_id;

    emitOverlay('lineage', subPacket);
    emitEvent('configComplete', subPacket);
  },

  position: (subPacket) => {
    const { data, toNodeNum, fromNodeNum } = subPacket;
    const { device_id, connId, timestamp } = subPacket.meta;
    const position = data.position;

    insertHandlers.insertPosition({
      fromNodeNum: data.fromNodeNum,
      toNodeNum: data.toNodeNum,
      latitude: data.latitude,
      longitude: data.longitude,
      altitude: data.altitude || null,
      sats_in_view: data.satsInView || null,
      batteryLevel: data.batteryLevel || null,
      device_id,
      conn_id: connId,
      timestamp,
    });

    emitOverlay('position', subPacket);
    emitEvent('locationUpdated', subPacket);
  },

  
  Waypoint: (subPacket) => {
    console.log('[dispatchNodes] ... Waypoint');
  },

  User: (subPacket) => {
    const user = subPacket.data;
    // const buf = subPacket.data.id;
    // console.log([...buf].map(b => b.toString(16).padStart(2,'0')).join(' '));
    // dissectString(subPacket.data.id);
    console.log('[dispatchNodes] ... User', subPacket);
  },

  Position: (packet) => {
    console.log('[dispatchNodes] ... Position');
  }
};
