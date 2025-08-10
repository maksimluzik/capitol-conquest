import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { GameRoomManager } from './roomManager.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const rooms = new GameRoomManager();

io.on('connection', socket => {
  console.log('client connected', socket.id);

  socket.on('joinMatch', () => {
    const room = rooms.assignRoom(socket);
    socket.join(room.id);
    const playerId = room.getPlayerId(socket.id);
    socket.emit('joined', { roomId: room.id, playerId });

    if (room.isReady()) {
      io.to(room.id).emit('startGame', {
        roomId: room.id,
        state: room.state,
        firstTurn: room.turn
      });
    }
  });

  socket.on('makeMove', move => {
    const room = rooms.getRoomBySocket(socket.id);
    if (!room) return;
    room.applyMove(move);
    socket.to(room.id).emit('opponentMove', move);
  });

  socket.on('disconnect', () => {
    const room = rooms.getRoomBySocket(socket.id);
    if (!room) return;
    room.markDisconnected(socket.id);
    socket.to(room.id).emit('opponentLeft');
  });

  socket.on('reconnectRoom', ({ roomId, playerId }) => {
    rooms.reconnect(roomId, playerId, socket);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
