const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const rooms = {};

io.on('connection', (socket) => {
  const { roomId, userId } = socket.handshake.query;

  socket.join(roomId);
  console.log(`User ${userId} joined room ${roomId}`);

  socket.on('sync_operation', (payload) => {
    // 广播给房间内除发送者外的所有人
    socket.to(payload.roomId).emit('apply_sync', payload);
  });

  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected`);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Alger Sync Server running on http://localhost:${PORT}`);
});
