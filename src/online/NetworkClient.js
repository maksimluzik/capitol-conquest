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

    // If already connected, disconnect first to ensure clean state
    if (this.socket && this.socket.connected) {
      console.log('NetworkClient: Disconnecting existing connection before reconnecting');
      this.disconnect();
    }

    // Load Socket.IO from CDN if not already loaded
    if (typeof io === 'undefined') {
      await this.loadSocketIO();
    }

    const target = this.url || this.getServerUrl();
    console.log('NetworkClient: Connecting to', target);
    this.socket = io(target, {
      forceNew: true, // Force a new connection
      timeout: 10000  // 10 second timeout
    });

    this.socket.on('connect', () => {
      console.log('NetworkClient: connected');
      this.socket.emit('joinMatch');
    });

    this.socket.on('joined', ({ roomId, playerId }) => {
      this.playerId = playerId;
      this.roomId = roomId;
      this.scene.events.emit('net-joined', { roomId, playerId });
    });

    this.socket.on('waiting', () => {
      this.scene.events.emit('net-waiting');
    });

    this.socket.on('matchFound', () => {
      this.scene.events.emit('net-matchFound');
    });

    this.socket.on('startGame', ({ state, firstTurn }) => {
      console.log('Starting game with state:', state);
      console.log('First turn:', firstTurn);
      
      // Load the game state (includes pieces) from server
      if (this.scene.gameManager && state) {
        // Regenerate board with server seed for consistency before loading state
        if (state.boardSeed) {
          this.scene.gameManager.regenerateBoardWithSeed(state.boardSeed);
          console.log('Board regenerated with seed:', state.boardSeed);
        }
        
        this.scene.gameManager.loadState(state);
        this.scene.gameManager.currentPlayer = firstTurn;
        
        console.log('Game state loaded, current player:', firstTurn);
      }
      
      this.scene.events.emit('net-startGame');
    });

    this.socket.on('opponentMove', move => {
      this.scene.gameManager?.applyNetworkMove?.(move);
    });

    this.socket.on('chatMessage', data => {
      console.log('NetworkClient: Received chat message:', data);
      this.scene.events.emit('net-chatMessage', data);
    });

    this.socket.on('opponentLeft', () => {
      console.log('Opponent disconnected');
      this.scene.events.emit('net-opponentLeft');
    });

    this.socket.on('disconnect', () => {
      console.log('NetworkClient: disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.scene.events.emit('net-connectionError');
    });
  }

  getServerUrl() {
    // Detect environment and return appropriate server URL
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    } else {
      // Production server URL - using HTTP since we don't have SSL setup
      return 'http://35.237.192.128';
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

  sendChat(message) {
    if (this.socket) {
      console.log('NetworkClient: Sending chat message:', message);
      this.socket.emit('chatMessage', message);
    } else {
      console.error('NetworkClient: Cannot send chat - no socket connection');
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('NetworkClient: Manually disconnecting from game');
      
      // Remove all event listeners to prevent any lingering callbacks
      this.socket.removeAllListeners();
      
      // Force disconnect from server
      this.socket.disconnect(true); // true = force close
      
      // Clear the socket reference
      this.socket = null;
      
      // Clear any stored connection state
      this.roomId = null;
      this.playerId = null;
      
      console.log('NetworkClient: Complete disconnection and cleanup performed');
    } else {
      console.log('NetworkClient: No active socket to disconnect');
    }
  }

  // Method to check if we're connected
  isConnected() {
    return this.socket && this.socket.connected;
  }

  // Method to completely reset the client state
  reset() {
    this.disconnect();
    this.scene = null;
    console.log('NetworkClient: Complete reset performed');
  }
}
