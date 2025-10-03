import http from 'node:http';

const options = {
  hostname: 'localhost', // or your mesh server IP
  port: 8080,            // adjust to match your server config
  path: '/api/v1/nodes',    // assuming this is your canonical route
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      console.log(`✅ Node list received:`, parsed);
    } catch (err) {
      console.error(`❌ Failed to parse response:`, err);
      console.log(`Raw body:`, body);
    }
  });
});

req.on('error', (err) => {
  console.error(`❌ HTTP request failed:`, err);
});

req.end();
