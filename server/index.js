import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { GameRoomManager } from './roomManager.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const rooms = new GameRoomManager();

io.on('connection', socket => {
  console.log('Client connected:', socket.id);

  socket.on('joinMatch', () => {
    console.log('Player requesting to join match:', socket.id);
    
    const room = rooms.assignRoom(socket);
    socket.join(room.id);
    const playerId = room.getPlayerId(socket.id);
    
    console.log(`Player ${socket.id} assigned to room ${room.id} as player ${playerId}`);
    
    // Send joined confirmation
    socket.emit('joined', { roomId: room.id, playerId });

    if (room.isReady()) {
      console.log(`Room ${room.id} is ready, starting match`);
      // Notify both players that match was found
      io.to(room.id).emit('matchFound');
      
      // Start game after countdown delay
      setTimeout(() => {
        const gameState = room.initializeGame();
        io.to(room.id).emit('startGame', {
          roomId: room.id,
          state: gameState,
          firstTurn: room.turn
        });
        console.log(`Game started in room ${room.id}`);
      }, 3500); // 3.5 seconds for countdown + buffer
    } else {
      // Player is waiting for opponent
      socket.emit('waiting');
      console.log(`Player ${socket.id} is waiting for opponent in room ${room.id}`);
    }
  });

  socket.on('makeMove', move => {
    const room = rooms.getRoomBySocket(socket.id);
    if (!room) {
      console.log('Move from unknown room:', socket.id);
      return;
    }
    
    console.log(`Move received from ${socket.id} in room ${room.id}:`, move);
    room.applyMove(move);
    socket.to(room.id).emit('opponentMove', move);
  });

  socket.on('chatMessage', message => {
    const room = rooms.getRoomBySocket(socket.id);
    if (!room) return;
    
    const playerId = room.getPlayerId(socket.id);
    console.log(`Chat message from player ${playerId} in room ${room.id}: ${message}`);
    
    io.to(room.id).emit('chatMessage', {
      playerId,
      message
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    const room = rooms.getRoomBySocket(socket.id);
    if (!room) return;
    
    console.log(`Player left room ${room.id}`);
    room.markDisconnected(socket.id);
    socket.to(room.id).emit('opponentLeft');
    
    // Clean up empty rooms
    if (room.isEmpty()) {
      rooms.removeRoom(room.id);
      console.log(`Removed empty room ${room.id}`);
    }
  });

  socket.on('reconnectRoom', ({ roomId, playerId }) => {
    console.log(`Reconnection attempt: room ${roomId}, player ${playerId}`);
    rooms.reconnect(roomId, playerId, socket);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Capitol Conquest Server listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
