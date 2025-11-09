  import createMQTTHandler from '../handlers/mqttHandler.js';
  import { config } from '../config/config.js';

//   --- MQTT Bridge ---
export async function startMqttServer() {
  const mqttHandler = createMQTTHandler('mqtt-bridge', {
    brokerUrl: config.mqtt.brokerUrl,
    subTopic: config.mqtt.subTopic,
    pubOptions: config.mqtt.pubOptions
  });
  mqttHandler.connect();
  return mqttHandler;
}
