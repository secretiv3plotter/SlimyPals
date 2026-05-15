const http = require('http');
const WebSocket = require('ws');
const app = require('./app');
const initJobs = require('./jobs');
require('dotenv').config();

const port = process.env.PORT || 3000;

// Initialize background jobs
initJobs();

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });
const presenceManager = require('./sockets/presenceManager');

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  presenceManager.handleConnection(ws, token);
});

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
  console.log(`WebSocket server is attached to HTTP server`);
});
