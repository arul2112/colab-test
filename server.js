const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const Y = require('yjs');
const { setupWSConnection } = require('y-websocket/bin/utils');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from the public directory
app.use(express.static('public'));

// Store active users and their cursors
const activeUsers = new Map();

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const userId = generateUserId();
  console.log(`New connection: ${userId}`);

  // Handle Yjs CRDT synchronization
  setupWSConnection(ws, req, { gc: true });

  // Handle cursor and user events
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'cursor') {
        // Broadcast cursor position to all other clients
        activeUsers.set(userId, {
          id: userId,
          cursor: data.cursor,
          color: data.color || generateRandomColor()
        });

        broadcastToOthers(ws, {
          type: 'cursor',
          userId: userId,
          cursor: data.cursor,
          color: activeUsers.get(userId).color,
          name: data.name || `User ${userId.slice(0, 4)}`
        });
      } else if (data.type === 'user-joined') {
        activeUsers.set(userId, {
          id: userId,
          name: data.name || `User ${userId.slice(0, 4)}`,
          color: data.color || generateRandomColor()
        });

        // Send existing users to new user
        ws.send(JSON.stringify({
          type: 'existing-users',
          users: Array.from(activeUsers.values())
        }));

        // Broadcast new user to all others
        broadcastToOthers(ws, {
          type: 'user-joined',
          user: activeUsers.get(userId)
        });
      }
    } catch (e) {
      // This is likely a Yjs sync message, let y-websocket handle it
    }
  });

  ws.on('close', () => {
    console.log(`Connection closed: ${userId}`);
    activeUsers.delete(userId);

    broadcast({
      type: 'user-left',
      userId: userId
    });
  });

  // Send user ID to client
  ws.send(JSON.stringify({
    type: 'init',
    userId: userId,
    color: generateRandomColor()
  }));
});

function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function broadcastToOthers(sender, data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function generateUserId() {
  return Math.random().toString(36).substring(2, 15);
}

function generateRandomColor() {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8B739', '#52B788', '#E63946', '#457B9D'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to start drawing`);
});
