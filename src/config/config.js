// config.js
import dotenv from 'dotenv';
dotenv.config();

export const API_URL = process.env.API_URL || 'https://meshtastic.local';

// === Device connection (bridge <-> node) ===
export const currentIPHost = process.env.NODE_IP_HOST || '192.168.1.52';
export const currentIPPort = parseInt(process.env.NODE_IP_PORT, 10) || 4403;
let currentIP = `${currentIPHost}:${currentIPPort}`;

// === WebSocket server (UI <-> bridge) ===
export const currentWSHost = process.env.WS_HOST || 'localhost';
export const currentWSPort = parseInt(process.env.WS_PORT, 10) || 3000;
export const currentWsUrl = `ws://${currentWSHost}:${currentWSPort}`;

// === Utility functions ===
export const getNodeIP = () => currentIP;
export const setNodeIP = (ip) => { currentIP = ip; };

export const getApiUrl = (addr = currentWsUrl) => `http://${addr}/api/v1`;

export const knownNodes = [
  { name: 'KD1MU Router', ip: '192.168.2.1' },
  { name: 'Node Alpha', ip: '192.168.2.78' },
  { name: 'Node Bravo', ip: '192.168.2.102' }
];

export function getWSUrl(input) {
  if (/^wss?:\/\//.test(input)) return input;
  if (/^!?[a-f0-9]{8}$/i.test(input)) {
    const cleanId = input.replace(/^!/, "");
    return `${currentWsUrl}/${cleanId}`;
  }
  return currentWsUrl;
}

export const debugLogger = (...args) => console.log(...args);

// === Unified config object ===
export const config = {
  // API listener
  api: {
    host: process.env.API_HOST || '0.0.0.0',
    port: parseInt(process.env.API_PORT, 10) || 8080
  },
  // WebSocket listener
  websocket: {
    host: currentWSHost,
    port: currentWSPort
  },
  // MQTT bridge
  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL || '',
    subTopic: 'mesh/ingest',
    pubOptions: { qos: 1 }
  },
  // TCP server listener (for inbound mesh frames)
  tcp: {
    host: process.env.TCP_HOST || '0.0.0.0',
    port: parseInt(process.env.TCP_PORT, 10) || 1337
  },
  // Node device connection details
  node: {
    host: currentIPHost,
    port: currentIPPort
  }
};
