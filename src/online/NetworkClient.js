import { io } from 'socket.io-client';

export class NetworkClient {
  constructor(scene, url) {
    this.scene = scene;
    this.url = url;
    this.socket = null;
    this.playerId = null;
    this.roomId = null;
  }

  connect() {
    if (typeof window === 'undefined') {
      // In tests or non-browser environments, skip real connection
      console.log('NetworkClient: running in headless mode, connection skipped');
      return;
    }
    const target = this.url || window.location.origin;
    this.socket = io(target);

    this.socket.on('connect', () => {
      console.log('NetworkClient: connected');
      this.socket.emit('joinMatch');
    });

    this.socket.on('joined', ({ roomId, playerId }) => {
      this.playerId = playerId;
      this.roomId = roomId;
    });

    this.socket.on('startGame', ({ state, firstTurn }) => {
      // Scene should provide method to load state
      this.scene.gameManager?.loadState?.(state);
      this.scene.gameManager.currentPlayer = firstTurn;
    });

    this.socket.on('opponentMove', move => {
      this.scene.gameManager?.applyNetworkMove?.(move);
    });

    this.socket.on('opponentLeft', () => {
      console.log('Opponent disconnected');
    });

    this.socket.on('disconnect', () => {
      console.log('NetworkClient: disconnected');
    });
  }

  sendMove(move) {
    if (this.socket) {
      this.socket.emit('makeMove', move);
    }
  }
}
