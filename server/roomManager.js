class GameRoom {
  constructor(id) {
    this.id = id;
    this.players = new Map(); // socket.id -> playerId
    this.state = { pieces: [], currentPlayer: 1 }; // minimal game state
    this.turn = 1;
    this.createdAt = new Date();
  }

  addPlayer(socket) {
    const playerId = this.players.size + 1;
    this.players.set(socket.id, playerId);
    console.log(`Added player ${playerId} (${socket.id}) to room ${this.id}`);
    return playerId;
  }

  isReady() {
    return this.players.size === 2;
  }

  isEmpty() {
    return this.players.size === 0;
  }

  getPlayerId(socketId) {
    return this.players.get(socketId);
  }

  initializeGame() {
    // Initialize a proper game state with starting pieces
    const s = 5; // Standard board size (matches Config.BOARD.DEFAULT_SIZE)
    
    // Correct corner positions for both players (6 corners of hexagon)
    // Player 1 gets 3 corners, Player 2 gets 3 opposite corners
    const initialPieces = [
      // Player 1 pieces (3 corners)
      { q: -s, r: 0, player: 1 },     // Left corner
      { q: 0, r: -s, player: 1 },     // Top-right corner  
      { q: -s, r: s, player: 1 },     // Bottom-left corner
      
      // Player 2 pieces (3 opposite corners)
      { q: s, r: 0, player: 2 },      // Right corner
      { q: 0, r: s, player: 2 },      // Bottom-right corner
      { q: s, r: -s, player: 2 }      // Top-left corner
    ];
    
    this.state = {
      pieces: initialPieces,
      currentPlayer: this.turn,
      gameStarted: true,
      startTime: new Date(),
      moveHistory: []
    };
    
    console.log(`Game initialized in room ${this.id}, player ${this.turn} goes first`);
    console.log(`Initial pieces:`, initialPieces);
    return this.state;
  }

  applyMove(move) {
    // Store the move and switch turns
    this.state.lastMove = move;
    this.state.moveHistory = this.state.moveHistory || [];
    this.state.moveHistory.push({
      move,
      player: this.turn,
      timestamp: new Date()
    });
    
    // Switch turns
    this.turn = this.turn === 1 ? 2 : 1;
    console.log(`Move applied in room ${this.id}, now player ${this.turn}'s turn`);
  }

  markDisconnected(socketId) {
    const playerId = this.players.get(socketId);
    this.players.delete(socketId);
    console.log(`Player ${playerId} (${socketId}) disconnected from room ${this.id}`);
  }

  getPlayerIds() {
    return Array.from(this.players.values());
  }
}

export class GameRoomManager {
  constructor() {
    this.rooms = new Map();
    this.waitingRoom = null;
  }

  assignRoom(socket) {
    // If no waiting room exists, create one
    if (!this.waitingRoom) {
      const id = this.generateRoomId();
      this.waitingRoom = new GameRoom(id);
      this.rooms.set(id, this.waitingRoom);
      console.log(`Created new waiting room: ${id}`);
    }

    const room = this.waitingRoom;
    room.addPlayer(socket);

    // If room is now full, clear the waiting room so next players get a new room
    if (room.isReady()) {
      this.waitingRoom = null;
      console.log(`Room ${room.id} is now full and ready to start`);
    }

    return room;
  }

  generateRoomId() {
    // Generate a more readable room ID
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  getRoomBySocket(socketId) {
    for (const room of this.rooms.values()) {
      if (room.players.has(socketId)) {
        return room;
      }
    }
    return null;
  }

  removeRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      // If this was the waiting room, clear it
      if (this.waitingRoom && this.waitingRoom.id === roomId) {
        this.waitingRoom = null;
      }
      this.rooms.delete(roomId);
      console.log(`Removed room ${roomId}`);
    }
  }

  reconnect(roomId, playerId, socket) {
    const room = this.rooms.get(roomId);
    if (!room) {
      socket.emit('reconnectFailed', { reason: 'Room not found' });
      return;
    }

    // Add player back to room
    room.players.set(socket.id, playerId);
    socket.join(room.id);
    
    socket.emit('rejoined', { 
      state: room.state, 
      turn: room.turn,
      playerId: playerId
    });
    
    console.log(`Player ${playerId} reconnected to room ${roomId}`);
  }

  // Utility methods for monitoring
  getRoomCount() {
    return this.rooms.size;
  }

  getPlayerCount() {
    let count = 0;
    for (const room of this.rooms.values()) {
      count += room.players.size;
    }
    return count;
  }

  getStats() {
    return {
      totalRooms: this.getRoomCount(),
      totalPlayers: this.getPlayerCount(),
      waitingRoom: this.waitingRoom ? this.waitingRoom.id : null
    };
  }
}
