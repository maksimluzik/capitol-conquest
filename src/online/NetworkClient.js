export class NetworkClient {
  constructor(scene, url) {
    this.scene = scene;
    this.url = url;
    this.socket = null;
    this.playerId = null;
    this.roomId = null;
  }

  async connect() {
    if (typeof window === 'undefined') {
      // In tests or non-browser environments, skip real connection
      console.log('NetworkClient: running in headless mode, connection skipped');
      return;
    }

    // Load Socket.IO from CDN if not already loaded
    if (typeof io === 'undefined') {
      await this.loadSocketIO();
    }

    const target = this.url || this.getServerUrl();
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

  getServerUrl() {
    // Detect environment and return appropriate server URL
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    } else {
      // Replace this with your actual production server URL
      return 'https://capitol-conquest-server.herokuapp.com';
    }
  }

  loadSocketIO() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  sendMove(move) {
    if (this.socket) {
      this.socket.emit('makeMove', move);
    }
  }
}
