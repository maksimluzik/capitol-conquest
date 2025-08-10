// Capitol Conquest Multiplayer Server
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Game room management
class GameRoom {
  constructor(id) {
    this.id = id;
    this.players = [];
    this.gameState = {
      board: Array(7).fill().map(() => Array(7).fill(null)),
      currentPlayer: 0, // 0 for player1, 1 for player2
      scores: { player1: 0, player2: 0 },
      gameOver: false,
      winner: null
    };
    this.currentPlayer = 0; // 0 for player1, 1 for player2
    this.createdAt = Date.now();
  }

  addPlayer(socket, name) {
    if (this.players.length >= 2) return false;
    
    const player = {
      id: socket.id,
      name: name,
      color: this.players.length === 0 ? 'blue' : 'red',
      socket: socket
    };
    
    this.players.push(player);
    console.log(`Player ${name} joined room ${this.id} as ${player.color}`);
    return true;
  }

  removePlayer(socketId) {
    this.players = this.players.filter(p => p.id !== socketId);
  }

  isFull() {
    return this.players.length === 2;
  }

  makeMove(playerId, move) {
    // Validate it's the player's turn
    if (this.currentPlayer !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    // Validate move (simplified validation)
    if (!this.isValidMove(move)) {
      return { success: false, error: 'Invalid move' };
    }

    // Apply move to game state
    this.applyMove(playerId, move);
    
    // Switch turns
    this.currentPlayer = 1 - this.currentPlayer;
    
    return { success: true };
  }

  isValidMove(move) {
    // Basic validation - ensure coordinates are within bounds
    const { from, to } = move;
    if (!from || !to) return false;
    if (from.row < 0 || from.row >= 7 || from.col < 0 || from.col >= 7) return false;
    if (to.row < 0 || to.row >= 7 || to.col < 0 || to.col >= 7) return false;
    return true;
  }

  applyMove(playerId, move) {
    // Apply move to board (simplified)
    const { from, to } = move;
    
    // Move piece
    const piece = this.gameState.board[from.row][from.col];
    this.gameState.board[from.row][from.col] = null;
    this.gameState.board[to.row][to.col] = piece;
    
    // Check for captures and update scores
    this.updateScoresAfterMove(playerId, to.row, to.col);
  }

  updateScoresAfterMove(playerId, row, col) {
    // Simplified capture logic - check adjacent pieces
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    let captures = 0;
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < 7 && newCol >= 0 && newCol < 7) {
        const adjacentPiece = this.gameState.board[newRow][newCol];
        if (adjacentPiece && adjacentPiece.player !== playerId) {
          // Check if this piece is surrounded (simplified)
          if (this.isSurrounded(newRow, newCol, adjacentPiece.player)) {
            this.gameState.board[newRow][newCol] = null;
            captures++;
          }
        }
      }
    }

    // Update scores
    if (playerId === 0) {
      this.gameState.scores.player1 += captures;
    } else {
      this.gameState.scores.player2 += captures;
    }
  }

  isSurrounded(row, col, playerId) {
    // Simplified surrounded check - if no adjacent empty spaces
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < 7 && newCol >= 0 && newCol < 7) {
        if (!this.gameState.board[newRow][newCol]) {
          return false; // Has empty adjacent space
        }
      }
    }
    return true; // No empty adjacent spaces
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayer];
  }

  getGameState() {
    return {
      ...this.gameState,
      currentPlayer: this.currentPlayer
    };
  }
}

// Room management
const gameRooms = new Map();

// Helper functions
function createRoom() {
  const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const room = new GameRoom(roomId);
  gameRooms.set(roomId, room);
  return room;
}

function findOrCreateRoom() {
  // Find an existing room with space
  for (const room of gameRooms.values()) {
    if (!room.isFull()) {
      return room;
    }
  }
  
  // Create new room if none available
  return createRoom();
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('joinGame', (data) => {
    const playerName = data.name || `Player${Math.floor(Math.random() * 1000)}`;
    
    // Find or create a room
    const gameRoom = findOrCreateRoom();
    
    // Add player to room
    if (gameRoom.addPlayer(socket, playerName)) {
      socket.join(gameRoom.id);
      socket.gameRoom = gameRoom.id;
      
      // If room is full, start the game
      if (gameRoom.isFull()) {
        console.log(`Game started: ${gameRoom.id} with ${gameRoom.players[0].name} vs ${gameRoom.players[1].name}`);
        
        io.to(gameRoom.id).emit('gameStarted', {
          roomId: gameRoom.id,
          players: gameRoom.players.map(p => ({ 
            id: p.id, 
            name: p.name, 
            color: p.color 
          })),
          currentPlayer: gameRoom.currentPlayer,
          gameState: gameRoom.getGameState()
        });
      } else {
        socket.emit('waitingForOpponent');
      }
    } else {
      socket.emit('error', { message: 'Room is full' });
    }
  });

  socket.on('makeMove', (moveData) => {
    const roomId = socket.gameRoom;
    const gameRoom = gameRooms.get(roomId);
    
    if (!gameRoom) {
      socket.emit('error', { message: 'Game room not found' });
      return;
    }

    // Find player ID
    const playerId = gameRoom.players.findIndex(p => p.id === socket.id);
    if (playerId === -1) {
      socket.emit('error', { message: 'Player not found in room' });
      return;
    }

    // Make move
    const result = gameRoom.makeMove(playerId, moveData);
    
    if (result.success) {
      // Broadcast move to all players in room
      io.to(roomId).emit('moveMade', {
        move: moveData,
        gameState: gameRoom.getGameState(),
        currentPlayer: gameRoom.currentPlayer
      });
    } else {
      socket.emit('moveRejected', { error: result.error });
    }
  });

  socket.on('chatMessage', (message) => {
    const roomId = socket.gameRoom;
    const gameRoom = gameRooms.get(roomId);
    
    if (gameRoom) {
      const player = gameRoom.players.find(p => p.id === socket.id);
      if (player) {
        socket.to(roomId).emit('chatMessage', {
          player: player.name,
          message: message,
          timestamp: Date.now()
        });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    const roomId = socket.gameRoom;
    if (roomId) {
      const gameRoom = gameRooms.get(roomId);
      if (gameRoom) {
        const disconnectedPlayer = gameRoom.players.find(p => p.id === socket.id);
        gameRoom.removePlayer(socket.id);
        
        // Notify other players
        if (disconnectedPlayer) {
          socket.to(roomId).emit('playerDisconnected', {
            name: disconnectedPlayer.name
          });
        }
        
        // Remove empty rooms
        if (gameRoom.players.length === 0) {
          gameRooms.delete(roomId);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Capitol Conquest server running on port ${PORT}`);
});
