// bridge/mqttHandler.js
import mqtt from 'mqtt';
import { decodeAndNormalize } from '../packets/packetDecoders.js';
import { routePacket } from '../core/ingestionRouter.js';

export default function createMQTTHandler(sourceId, {
  brokerUrl = 'mqtt://broker.hivemq.com',
  subTopic = 'meshtastic/node/+/+',
  pubOptions = { qos: 0, retain: false },
  clientId = `meshClient-${Math.random().toString(16).slice(2)}`
} = {}) {
  let client = null;

  const connect = () => {
    client = mqtt.connect(brokerUrl, { clientId });

    client.on('connect', () => {
      console.log(`[MQTT ${sourceId}] Connected to broker at ${brokerUrl}`);
      client.subscribe(subTopic, (err) => {
        if (err) {
          console.error(`[MQTT ${sourceId}] Subscription error:`, err.message, err.code);
        } else {
          console.log(`[MQTT ${sourceId}] Subscribed to topic: ${subTopic}`);
        }
      });
    });

    client.on('message', (topic, message) => {
      const packet = decodeAndNormalize(message, 'mqtt', sourceId);
      if (!packet || packet.type === 'Unknown') return;

      const meta = {
        source: 'mqtt',
        brokerUrl,
        topic,
        sourceId,
        clientId,
        transport: 'mqtt'
      };

      routePacket(packet, meta);
    });

    client.on('error', (err) => {
      console.error(`[MQTT ${sourceId}] Error:`, err.message, err.code);
      console.log("got an error but no message", err);
    });

    client.on('close', () => {
      console.warn(`[MQTT ${sourceId}] Connection closed`);
    });

    client.on('reconnect', () => {
      console.log(`[MQTT ${sourceId}] Reconnecting...`);
    });
  };

  const publish = (packet) => {
    if (packet?.source === 'mqtt') return; // avoid echo
    if (!packet?.nodeId || !packet?.type || packet.type === 'Unknown') return;

    const topic = `meshtastic/node/${packet.nodeId}/${packet.type.toLowerCase()}`;
    client.publish(topic, JSON.stringify(packet), pubOptions);
    console.log(`[MQTT ${sourceId}] Published to ${topic}`);
  };

  const disconnect = () => {
    if (client) {
     client.end();
     console.log(`[MQTT ${sourceId}] Disconnected`);
    }
  };

  return { connect, publish, disconnect };
}
