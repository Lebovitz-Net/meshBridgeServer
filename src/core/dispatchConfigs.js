import { insertHandlers } from '../db/insertHandlers.js';
import { emitOverlay } from '../overlays/overlayEmitter.js';
import { emitEvent } from '../events/eventEmitter.js';

export const dispatchConfigs = {

    config: (subPacket)  => {
        const { meta, data } = subPacket;
        const config = data.config;
        if (Object.keys(data).length) {
            const [key, value] = Object.entries(config)[0];

            insertHandlers.insertConfig({
            fromNodeNum: meta.fromNodeNum,
            key,
            data: JSON.stringify(value),
            timestamp: meta.fromNodeNum,
            device_id: meta.device_id,
            connId: meta.connId
            });
        }

        emitOverlay('config', subPacket);
        emitEvent('configSet', subPacket);
    },

    // Config oneofs

    device: (subPacket) => {
        console.log('[dispatchConfig] device');
    },
    
    security: (subPacket) => {
        console.log('[dispatchConfig] security');
    },

    moduleConfig: (subPacket)  => {
        const { meta, data } = subPacket;
        const config = data.moduleConfig;
        const [key, value] = Object.entries(config)[0];
        if (Object.keys(value).length === 0) {
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

    DeviceUIConfig: (subPacket) => {
         console.debug('[dispatchConfig] Ignoring DeviceUIConfig');       
    },
    deviceuiConfig: (subPacket) => {
        console.debug('[dispatchConfig] Ignoring deviceuiConfig');
    },

    adminMessage: (subPacket) => {
        console.debug('[dispatchConfig] Ignoring AdminMessage');
        emitOverlay('adminMessage', subPacket);
    },

    routingMessage: (subPacket) => {
        console.debug('[dispatchConfig] Ignoring Routing');
        emitOverlay('Routing', subPacket);
    },

    RouteDiscovery: (subPacket) => {
        console.log('[dispatchConfig] RouteDiscovery');
    },

    Routing: (subPacket) => {
        console.log('[dispatchConfig] Routing');
    },

    metadata: (subPacket) => {
        const {data, meta } = subPacket;
        const metadata = data.metadata;
        if (Object.keys(metadata).length === 0) {
            console.warn('[dispatchRegistery] metadata object is empty', metadata);
            return;
        }

        insertHandlers.insertMetadata ({
            ...metadata,
            canShutdown: metadata.canShutdown ? 1 : 0,
            hasWifi: metadata.hasWifi ? 1 : 0,
            hasBluetooth: metadata.hasBluetooth ? 1 : 0,
            hasPKC: metadata.hasPKC ? 1 : 0,
            num: meta.fromNodeNum,
        });
    },

    DeviceMetadata: (subPacket) => {
        console.log('[dispatchConfig] ... DeviceMetadta', subPacket);
    },

    fileInfo: (subPacket) => {
        const { data, meta } = subPacket;
        const fileInfo = data.fileInfo;
        insertHandlers.insertFileInfo({
            filename: fileInfo.fileName,
            size: fileInfo.sizeBytes,
            mime_type: fileInfo.mime_type || null,
            description: fileInfo.description || null,
            fromNodeNum: meta.fromNodeNum,
            device_id: meta.device_id,
            connId: meta.connId,
            timestamp: meta.timestamp,
        });
    },
      
    mqttClientProxyMessage: (subPacket) => {
        // console.log('...dispatchRegistery mqttCLientProxyMessage', subPacket);
    },

    KeyVerification: (subPacket) => {
        console.log('[dispatchConfigs] KeyVerification');
    },

    keyVerificationNumberRequest: (subPacket) => {
        console.log('[dispatchConfig] keyVerificationNumberRequest');
    },

    configCompleteId: (subPacket) => {
        console.log('[dispatchConfig configComplete', subPacket);
        emitEvent('configComplete');
    },
};