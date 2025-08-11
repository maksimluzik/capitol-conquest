class GameRoom {
  constructor(id) {
    this.id = id;
    this.players = new Map(); // socket.id -> playerId
    this.state = { pieces: [], currentPlayer: 1 }; // minimal game state
    this.turn = 1;
  }

  addPlayer(socket) {
    const playerId = this.players.size + 1;
    this.players.set(socket.id, playerId);
    return playerId;
  }

  isReady() {
    return this.players.size === 2;
  }

  getPlayerId(socketId) {
    return this.players.get(socketId);
  }

  applyMove(move) {
    // Example: push moves into state; real implementation would validate
    this.state.lastMove = move;
    this.turn = this.turn === 1 ? 2 : 1;
  }

  markDisconnected(socketId) {
    this.players.delete(socketId);
  }
}

export class GameRoomManager {
  constructor() {
    this.rooms = new Map();
    this.waitingRoom = null;
  }

  assignRoom(socket) {
    if (!this.waitingRoom) {
      const id = Math.random().toString(36).slice(2, 9);
      this.waitingRoom = new GameRoom(id);
      this.rooms.set(id, this.waitingRoom);
    }
    const room = this.waitingRoom;
    const playerId = room.addPlayer(socket);
    if (room.isReady()) this.waitingRoom = null;
    return room;
  }

  getRoomBySocket(socketId) {
    for (const room of this.rooms.values()) {
      if (room.players.has(socketId)) return room;
    }
    return null;
  }

  reconnect(roomId, playerId, socket) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.players.set(socket.id, playerId);
    socket.join(room.id);
    socket.emit('rejoined', { state: room.state, turn: room.turn });
  }
}
