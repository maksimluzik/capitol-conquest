const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://maksimluzik.github.io'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://maksimluzik.github.io'] 
      : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080'],
    credentials: true
  }
});

// Game state management
const gameRooms = new Map();
const waitingPlayers = [];

class GameRoom {
  constructor(id, player1, player2) {
    this.id = id;
    this.players = [player1, player2];
    this.currentPlayer = 0; // 0 for player1, 1 for player2
    this.gameState = {
      board: this.initializeBoard(),
      scores: { player1: 0, player2: 0 },
      gameOver: false,
      winner: null
    };
    this.lastMoveTime = Date.now();
    
    // Assign colors to players
    player1.color = 'blue';
    player2.color = 'red';
  }

  initializeBoard() {
    // Initialize 8x8 board with empty spaces
    const board = [];
    for (let row = 0; row < 8; row++) {
      board[row] = [];
      for (let col = 0; col < 8; col++) {
        board[row][col] = null;
      }
    }
    
    // Place initial pieces (simplified starting position)
    // Player 1 (blue) starts at bottom
    board[7][3] = { player: 0, type: 'piece' };
    board[7][4] = { player: 0, type: 'piece' };
    
    // Player 2 (red) starts at top
    board[0][3] = { player: 1, type: 'piece' };
    board[0][4] = { player: 1, type: 'piece' };
    
    return board;
  }

  makeMove(playerId, move) {
    // Validate it's the player's turn
    if (this.currentPlayer !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    // Validate move format
    if (!move || !move.from || !move.to) {
      return { success: false, error: 'Invalid move format' };
    }

    // Validate move bounds
    const { from, to } = move;
    if (!this.isValidPosition(from) || !this.isValidPosition(to)) {
      return { success: false, error: 'Move out of bounds' };
    }

    // Validate piece ownership
    const piece = this.gameState.board[from.row][from.col];
    if (!piece || piece.player !== playerId) {
      return { success: false, error: 'Invalid piece' };
    }

    // Validate destination is empty
    if (this.gameState.board[to.row][to.col] !== null) {
      return { success: false, error: 'Destination occupied' };
    }

    // Apply move
    this.gameState.board[to.row][to.col] = piece;
    this.gameState.board[from.row][from.col] = null;

    // Switch turns
    this.currentPlayer = 1 - this.currentPlayer;
    this.lastMoveTime = Date.now();

    // Check for captures and update scores
    this.checkCaptures(to, playerId);

    return { success: true, gameState: this.gameState };
  }

  isValidPosition(pos) {
    return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
  }

  checkCaptures(lastMove, playerId) {
    // Simplified capture logic - check adjacent pieces
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    let captures = 0;
    for (const [dr, dc] of directions) {
      const newRow = lastMove.row + dr;
      const newCol = lastMove.col + dc;
      
      if (this.isValidPosition({ row: newRow, col: newCol })) {
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
      
      if (this.isValidPosition({ row: newRow, col: newCol })) {
        if (this.gameState.board[newRow][newCol] === null) {
          return false; // Has an escape route
        }
      }
    }
    return true; // Completely surrounded
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayer];
  }

  getOpponent(playerId) {
    return this.players[1 - playerId];
  }
}

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('joinGame', (playerData) => {
    const player = {
      id: socket.id,
      name: playerData.name || `Player${socket.id.slice(-4)}`,
      socket: socket
    };

    // Add to waiting players
    waitingPlayers.push(player);
    socket.player = player;

    // Try to match players
    if (waitingPlayers.length >= 2) {
      const player1 = waitingPlayers.shift();
      const player2 = waitingPlayers.shift();
      
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const gameRoom = new GameRoom(roomId, player1, player2);
      
      gameRooms.set(roomId, gameRoom);

      // Join socket rooms
      player1.socket.join(roomId);
      player2.socket.join(roomId);

      // Store room reference in socket
      player1.socket.roomId = roomId;
      player2.socket.roomId = roomId;

      // Notify players game started
      io.to(roomId).emit('gameStarted', {
        roomId: roomId,
        players: [
          { id: player1.id, name: player1.name, color: player1.color },
          { id: player2.id, name: player2.name, color: player2.color }
        ],
        currentPlayer: gameRoom.currentPlayer,
        gameState: gameRoom.gameState
      });

      console.log(`Game started: ${roomId} with ${player1.name} vs ${player2.name}`);
    } else {
      socket.emit('waitingForOpponent');
    }
  });

  socket.on('makeMove', (moveData) => {
    const roomId = socket.roomId;
    const gameRoom = gameRooms.get(roomId);

    if (!gameRoom) {
      socket.emit('error', { message: 'Game room not found' });
      return;
    }

    // Find player index
    const playerId = gameRoom.players.findIndex(p => p.id === socket.id);
    if (playerId === -1) {
      socket.emit('error', { message: 'Player not found in game' });
      return;
    }

    const result = gameRoom.makeMove(playerId, moveData);

    if (result.success) {
      // Broadcast move to all players in room
      io.to(roomId).emit('moveMade', {
        playerId: playerId,
        move: moveData,
        gameState: result.gameState,
        currentPlayer: gameRoom.currentPlayer
      });
    } else {
      socket.emit('moveRejected', { error: result.error });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);

    // Remove from waiting players
    const waitingIndex = waitingPlayers.findIndex(p => p.id === socket.id);
    if (waitingIndex !== -1) {
      waitingPlayers.splice(waitingIndex, 1);
    }

    // Handle game room cleanup
    if (socket.roomId) {
      const gameRoom = gameRooms.get(socket.roomId);
      if (gameRoom) {
        // Notify opponent of disconnection
        socket.to(socket.roomId).emit('playerDisconnected', {
          message: 'Your opponent has disconnected'
        });
        
        // Clean up game room
        gameRooms.delete(socket.roomId);
      }
    }
  });

  socket.on('chatMessage', (message) => {
    const roomId = socket.roomId;
    if (roomId && socket.player) {
      socket.to(roomId).emit('chatMessage', {
        player: socket.player.name,
        message: message,
        timestamp: Date.now()
      });
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    players: waitingPlayers.length,
    games: gameRooms.size,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Capitol Conquest server running on port ${PORT}`);
});

// Cleanup inactive games
setInterval(() => {
  const now = Date.now();
  const timeout = 10 * 60 * 1000; // 10 minutes

  for (const [roomId, room] of gameRooms) {
    if (now - room.lastMoveTime > timeout) {
      console.log(`Cleaning up inactive game: ${roomId}`);
      gameRooms.delete(roomId);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes
