// --- MQTT Bridge ---
import MqttClient from '../handlers/MqttClient.js';
import { config } from '../config/config.js';

export async function startMqttServer() {
  const client = new MqttClient(config.mqtt.brokerUrl, {
    clientId: "mqtt-bridge-" + Date.now(),
    protocolVersion: 4,   // MQTT v3.1.1
    clean: true,          // start fresh session
    keepalive: 60,         // send PINGREQ every 60s
  });

  client.connect();

  // Subscribe to the configured topic
  client.subscribe(config.mqtt.subTopic);

  return client;
}
