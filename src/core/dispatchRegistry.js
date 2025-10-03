import { insertHandlers } from '../db/insertHandlers.js';
import { emitOverlay } from '../overlays/overlayEmitter.js';
import { emitEvent } from '../events/eventEmitter.js';

export const dispatchRegistry = {
  // MeshPacket-derived types
  message: (subPacket) => {

    const { data, meta } = subPacket;
    const { fromNodeNum, toNodeNum, device_id, timestamp, connId } = meta;

    insertHandlers.insertMessage({
      message: data.message,
      message_id: meta.packetId,
      fromNodeNum,
      toNodeNum,
      device_id,
      connId,
      timestamp,
      channel: meta.channel,
    });

    emitOverlay('message', subPacket);
    emitEvent('messageReceived', subPacket);
  },

  config: (subPacket)  => {
    const { meta, data } = subPacket;
    const [key, value] = Object.entries(data)[0];

    insertHandlers.insertConfig({
      fromNodeNum: meta.fromNodeNum,
      key,
      data: JSON.stringify(value),
      timestamp: meta.fromNodeNum,
      device_id: meta.device_id,
      connId: meta.connId
    });

    emitOverlay('config', subPacket);
    emitEvent('configSet', subPacket);
  },

  moduleConfig: (subPacket)  => {
    const { meta, data } = subPacket;
    const [key, value] = Object.entries(data)[0];

    if (Object.keys(value).length === 0) {
      console.log('[dispatchRouter] moduleConfig data is empty', value);
      return;
    }

    insertHandlers.insertModuleConfig({
      fromNodeNum: meta.fromNodeNum,
      key,
      data: JSON.stringify(value),
      timestamp: meta.fromNodeNum,
      device_id: meta.device_id,
      connId: meta.connId
    });

    emitOverlay('config', subPacket);
    emitEvent('configSet', subPacket);
  },

  position: (subPacket) => {
    const { data, toNodeNum, fromNodeNum } = subPacket;
    const { device_id, connId, timestamp } = subPacket.meta;

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

  myInfo: (subPacket) => {

      const { data, connId, timestamp, meta } = subPacket;
      const result = insertHandlers.insertMyInfo({
        ...data,
        connId,
        currentIP: meta.device_id,
        timestamp: timestamp || meta.timestamp,
      });
  },

  nodeInfo: (subPacket) => {
    const { data, connId, timestamp, meta, device_id } = subPacket;
    const result = insertHandlers.upsertNodeInfo({
      ...data,
      num: data?.num || meta?.fromNodeNum,
      conn_id: connId,
      timestamp,
      device_id: device_id || meta.device_id || null,
    });

    if (result?.num) subPacket.fromNodeNum = result.num;
    if (result?.device_id) subPacket.device_id = result.device_id;

    emitOverlay('lineage', subPacket);
    emitEvent('configComplete', subPacket);
  },

  telemetry: (subPacket) => {
    const { data, fromNodeNum, toNodeNum, connId, timestamp } = subPacket;

    insertHandlers.insertMetricsHandler({
      fromNodeNum,
      toNodeNum,
      conn_id: connId,
      timestamp,
      ...data,
    });

    emitOverlay('telemetry', subPacket);
  },

  adminMessage: (subPacket) => {
    console.debug('[dispatchRegistry] Ignoring AdminMessage');
    emitOverlay('adminMessage', subPacket);
  },

  // FromRadio oneofs
  logRecord: (subPacket) => {
    const { data, meta } = subPacket;
    insertHandlers.insertLogRecord({ ...data, ...meta });
    emitOverlay('queueHealth', subPacket);
  },

  metadata: (subPacket) => {
    const {data, meta } = subPacket;
    if (Object.keys(data).length === 0) {
      console.warn('[dispatchRegistery] metadata object is empty', data);
      return;
    }

    insertHandlers.insertMetadata ({
      ...data,
      canShutdown: data.canShutdown ? 1 : 0,
      hasWifi: data.hasWifi ? 1 : 0,
      hasBluetooth: data.hasBluetooth ? 1 : 0,
      hasPKC: data.hasPKC ? 1 : 0,
      num: meta.fromNodeNum,
    });
  },

  fileInfo: (subPacket) => {
    const { data, meta } = subPacket;
    insertHandlers.insertFileInfo({
      filename: data.fileName,
      size: data.sizeBytes,
      mime_type: data.mime_type || null,
      description: data.description || null,
      fromNodeNum: meta.fromNodeNum,
      device_id: meta.device_id,
      connId: meta.connId,
      timestamp: meta.timestamp,
    });
  },

  channel: (subPacket) => {
    const { type, data, meta } = subPacket;
    const settings = data.settings;

    if (data?.role) {
      insertHandlers.insertChannel({
        channel_num: settings?.channelNum || 0,
        num: meta.fromNodeNum,
        device_id: meta.device_id,
        index: data.index || 0,
        name: settings.name || 'default',
        role: data.role,
        psk: settings.psk || null,
        uplink_enabled: settings.uplinkEnabled ? 1: 0,
        downlink_enabled: settings.downlinkEnabled ? 1 : 0,
        module_settings_json: settings.moduleSettings ? JSON.stringify(settings.moduleSettings) : null,
        conn_id: meta.connId,
        timestamp: Date.now(),
      });
    }
  },

  queueStatus: (subPacket) => {
    const { data, fromNodeNum, device_id, connId, timestamp } = subPacket;
    insertHandlers.insertQueueStatus({
      num: fromNodeNum,
      device_id,
      res: data.res,
      free: data.free,
      maxlen: data.maxlen,
      mesh_packet_id: data.meshPacketId || null,
      conn_id: connId,
      timestamp,
    });
  },

  configCompleteId: (subPacket) => {
    emitEvent('configComplete', subPacket);
  },
};
