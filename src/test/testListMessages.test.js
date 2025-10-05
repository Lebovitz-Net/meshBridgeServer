// testListMessages.test.js
// import fetch from 'node-fetch';

async function testListMessages(channelId) {
  try {
    const res = await fetch(`http://localhost:8080/api/v1/channels/${channelId}/messages`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    console.log(`✅ Messages for channel ${channelId}:`, data);
  } catch (err) {
    console.error(`❌ Error fetching messages for channel ${channelId}:`, err);
  }
}

// Example usage
testListMessages(0); // replace with a real channel id
