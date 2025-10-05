// File: testChannels.js
//  import fetch from 'node-fetch'; // if using Node 18+, fetch is built-in

const BASE_URL = 'http://localhost:8080/api/v1';

async function testChannels(nodeNum) {
  try {
    const res = await fetch(`${BASE_URL}/channels/${nodeNum}`);
    console.log(`[Request] GET /channels/${nodeNum} → status ${res.status}`);

    if (!res.ok) {
      const text = await res.text();
      console.error('[Error response]', text);
      return;
    }

    const data = await res.json();
    console.log('[Response JSON]', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[Test error]', err);
  }
}

// Run with: node testChannels.js 123
const nodeNum = process.argv[2] || 1;
testChannels(nodeNum);
