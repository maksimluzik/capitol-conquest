class NetworkManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.gameRoom = null;
        this.playerId = null;
        this.playerData = null;
        this.callbacks = {};
        
        // Server URL configuration
        this.serverUrl = this.getServerUrl();
    }

    getServerUrl() {
        // Detect environment and return appropriate server URL
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        } else {
            // Replace this with your actual production server URL
            // Examples:
            // return 'https://your-app.herokuapp.com';
            // return 'https://your-app.railway.app';
            // return 'https://your-server.com';
            return 'https://capitol-conquest-server.herokuapp.com';
        }
    }

    async connect() {
        return new Promise((resolve, reject) => {
            try {
                // Load Socket.IO from CDN if not already loaded
                if (typeof io === 'undefined') {
                    this.loadSocketIO().then(() => {
                        this.initializeSocket(resolve, reject);
                    }).catch(reject);
                } else {
                    this.initializeSocket(resolve, reject);
                }
            } catch (error) {
                reject(error);
            }
        });
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

    initializeSocket(resolve, reject) {
        try {
            this.socket = io(this.serverUrl, {
                transports: ['websocket', 'polling'],
                timeout: 10000
            });

            this.socket.on('connect', () => {
                console.log('Connected to multiplayer server');
                this.isConnected = true;
                this.setupEventHandlers();
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                console.error('Connection failed:', error);
                this.isConnected = false;
                reject(error);
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
                this.isConnected = false;
                this.emit('disconnected');
            });

        } catch (error) {
            reject(error);
        }
    }

    setupEventHandlers() {
        this.socket.on('gameStarted', (data) => {
            console.log('Game started:', data);
            this.gameRoom = data.roomId;
            
            // Find our player data
            this.playerData = data.players.find(p => p.id === this.socket.id);
            this.playerId = data.players.findIndex(p => p.id === this.socket.id);
            
            this.emit('gameStarted', data);
        });

        this.socket.on('waitingForOpponent', () => {
            console.log('Waiting for opponent...');
            this.emit('waitingForOpponent');
        });

        this.socket.on('moveMade', (data) => {
            console.log('Move made:', data);
            this.emit('moveMade', data);
        });

        this.socket.on('moveRejected', (data) => {
            console.log('Move rejected:', data);
            this.emit('moveRejected', data);
        });

        this.socket.on('playerDisconnected', (data) => {
            console.log('Player disconnected:', data);
            this.emit('playerDisconnected', data);
        });

        this.socket.on('chatMessage', (data) => {
            console.log('Chat message:', data);
            this.emit('chatMessage', data);
        });

        this.socket.on('error', (data) => {
            console.error('Server error:', data);
            this.emit('error', data);
        });
    }

    joinGame(playerName = 'Anonymous') {
        if (!this.isConnected) {
            throw new Error('Not connected to server');
        }

        this.socket.emit('joinGame', {
            name: playerName,
            timestamp: Date.now()
        });
    }

    makeMove(from, to) {
        if (!this.isConnected || !this.gameRoom) {
            throw new Error('Not in a game');
        }

        const moveData = {
            from: { row: from.row, col: from.col },
            to: { row: to.row, col: to.col },
            timestamp: Date.now()
        };

        this.socket.emit('makeMove', moveData);
    }

    sendChatMessage(message) {
        if (!this.isConnected || !this.gameRoom) {
            throw new Error('Not in a game');
        }

        this.socket.emit('chatMessage', message);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
        this.gameRoom = null;
        this.playerId = null;
        this.playerData = null;
    }

    // Event system
    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }

    off(event, callback) {
        if (this.callbacks[event]) {
            const index = this.callbacks[event].indexOf(callback);
            if (index > -1) {
                this.callbacks[event].splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in event callback:', error);
                }
            });
        }
    }

    // Utility methods
    isMyTurn(currentPlayer) {
        return this.playerId === currentPlayer;
    }

    getMyColor() {
        return this.playerData ? this.playerData.color : null;
    }

    getOpponentData(players) {
        return players.find(p => p.id !== this.socket.id);
    }

    // Connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            hasGameRoom: !!this.gameRoom,
            playerId: this.playerId,
            playerColor: this.getMyColor()
        };
    }
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetworkManager;
}

// ES6 export for browser modules
export { NetworkManager };
