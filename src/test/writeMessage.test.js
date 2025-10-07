// writeMessageTest.js
// import fetch from 'node-fetch';

const API_URL = 'http://localhost:8080/api/v1/sendMessage';

const testPacket = {
  messageId: Date.now(),
  fromNodeNum: 3758940216,
  toNodeNum:4294967295 ,
  channelNum: 0,
  payload: 'Can someone please Acknowledge this message. Trying a new client',
};

async function sendTestMessage(packet) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(packet)
    });

    const result = await response.json();
    console.log('...sendTestMessage here');
    console.log('✅ Message sent:', result);
  } catch (err) {
    console.error('❌ Failed to send message:', err.message);
  }
}

sendTestMessage(testPacket);
