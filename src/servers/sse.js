import express from 'express';
export const sseRouter = express.Router();

const clients = [];

sseRouter.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write('data: Connected\n\n');
  clients.push(res);

  req.on('close', () => {
    clients.splice(clients.indexOf(res), 1);
  });
});

// Broadcast function
export const broadcastEvent = (event) => {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  clients.forEach(res => res.write(payload));
};