import mqtt from "mqtt";

class MqttClient {
  constructor(broker, options = {}) {
    this.broker = broker;
    this.options = options;
    this.client = null;
  }

  connect(nodeId) {
    this.client = mqtt.connect(this.broker, this.options);

    this.client.on("connect", () => {
      console.log(`[MQTT] Connected to ${this.broker}`);

      // Subscriptions
      this.client.subscribe("meshcore/test", { qos: 1 });
      this.client.subscribe("meshcore/ingest", { qos: 1 });
      this.client.subscribe(`meshcore/${nodeId}/downlink`, { qos: 1 });
      this.client.subscribe("meshcore/+/uplink", { qos: 1 }, (err) => {
        if (err) {
          console.error("[MQTT] Subscribe error:", err);
        } else {
          console.log("[MQTT] Subscribed to meshcore uplinks");
        }
      });

      // Test publish
      this.client.publish("meshcore/test", "Hello MeshCore!", { qos: 1 });
    });

    this.client.on("error", (err) => {
      console.error("[MQTT] Connection error:", err);
      // Let mqtt.js handle reconnects instead of forcing end()
    });

    this.client.on("close", () => {
      console.log("[MQTT] Connection closed");
    });

    this.client.on("message", (topic, message) => {
      const parts = topic.split("/");
      const nodeId = parts[1]; // meshcore/<nodeId>/uplink or downlink

      let payload;
      try {
        payload = JSON.parse(message.toString());
      } catch {
        payload = message.toString(); // fallback to raw string
      }

      if (topic.endsWith("/uplink")) {
        console.log(`[MQTT] Uplink from ${nodeId}:`, payload);
        // TODO: process uplink payload (store, forward, etc.)
      } else if (topic.endsWith("/downlink")) {
        console.log(`[MQTT] Downlink for ${nodeId}:`, payload);
        // TODO: forward payload into MeshCore
      } else {
        console.log("[MQTT] Other message:", topic, payload);
      }
    });
  }


  disconnect() {
    if (this.client) {
      this.client.end();
      console.log("[MQTT] Disconnected");
    }
  }

  subscribe(topic, qos = 0) {
    if (!this.client) return;
    this.client.subscribe(topic, { qos }, (err) => {
      if (err) {
        console.error(`[MQTT] Subscribe error: ${err}`);
      } else {
        console.log(`[MQTT] Subscribed to ${topic}`);
      }
    });
  }

  publish(topic, payload, qos = 0, retain = false) {
    if (!this.client) return;
    this.client.publish(topic, payload, { qos, retain }, (err) => {
      if (err) {
        console.error(`[MQTT] Publish error: ${err}`);
      } else {
        console.log(`[MQTT] Published to ${topic}: ${payload}`);
      }
    });
  }

  setOnMessage(callback) {
    if (this.client) {
      this.client.on("message", callback);
    }
  }

  setOnConnect(callback) {
    if (this.client) {
      this.client.on("connect", callback);
    }
  }

  setOnDisconnect(callback) {
    if (this.client) {
      this.client.on("close", callback);
    }
  }
}

export default MqttClient;
