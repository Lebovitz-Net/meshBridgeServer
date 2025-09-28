import { insertHandlers } from '../db/insertHandlers.js';
import { insertMetricsHandler } from '../db/insertMetricsHandler.js';

export function routeMeshDecoded(packet, meshDecoded, num, ts) {
  if (!meshDecoded || !num) return;
  // console.log('[routeMeshDecoded] node number', num, meshDecoded);
  // ==================================
 
  if (meshDecoded.type === 'Message' && meshDecoded.message) {
    packet.message = meshDecoded.message;
    packet.channelInfo = meshDecoded.channelInfo;
    const channelID = meshDecoded.channelInfo?.channel_id;
    insertHandlers.insertMessage({
      message_id: packet.id,
      fromNodeNum: packet.from,
      toNodeNum: packet.to,
      channel_id: channelID || 0,
      sender: meshDecoded.message.sender,
      content: meshDecoded.message.content,
      viaMqtt: packet.viaMqtt ? 1 :  0,
      hopStart: packet.hopStart,
      timestamp: packet.rxTime || ts
    });

    if (channelID !== undefined) {
      insertHandlers.insertChannel({
          channel_id: meshDecoded.channelInfo.channel_id,
          num,
          name: meshDecoded.channelInfo.name || null
        });
    };

    //==================================

  } else if (meshDecoded.type === 'Position' && meshDecoded.position) {
    packet.position = meshDecoded.position;

    insertHandlers.insertPosition({
      fromNodeNum: meshDecoded.position.fromNodeNum,
      toNodeNum: meshDecoded.position.toNodeNum,
      latitude: meshDecoded.position.latitudeI,
      longitude: meshDecoded.position.longitudeI,
      altitude: meshDecoded.position.altitude,
      timestamp: meshDecoded.position.time || ts
    });

    //=====================================

  } else if (meshDecoded.type === 'Telemetry' && meshDecoded.telemetry) {
    packet.telemetry = meshDecoded.telemetry;

    const num = meshDecoded.telemetry.fromNodeNum ?? null;
    const deviceMetrics = meshDecoded.telemetry.deviceMetrics;
    const lastHeard = Date.now(); // or extract from packet if available

    if (num) {
      insertMetricsHandler(meshDecoded);
    } else {
      console.warn('[routeMeshDecoded] Skipping telemetry insert: missing fromNodeNum or metrics', meshDecoded);
    }

    //======================================

  } else if (meshDecoded.type === 'NodeInfo' && meshDecoded.user) {
    packet.nodeInfo = meshDecoded.user;
    
    const nodeInfoObject = { num: meshDecoded.num ? meshDecoded.num : num, ...meshDecoded.User };

    const result = insertHandlers.upsertNodeInfo(nodeInfoObject);
    if (!result?.num) {
      console.warn('[routeMeshDecoded] NodeInfo decode returned no num:');
    }
    // Admin packet
  } else if (meshDecoded.type === 'AdminMessage') {
    console.log('[routeMeshDecoded] Ignored AdminMessage packet');

  } else {
    console.warn('[routeMeshDecoded] Skipped insert: unknown or incomplete meshDecoded type', meshDecoded);
  }
}
