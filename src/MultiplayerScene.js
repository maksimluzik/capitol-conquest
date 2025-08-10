import { GameManager } from './GameManager.js';
import { UIManager } from './UIManager.js';
import { Board } from './Board.js';
import { NetworkManager } from './NetworkManager.js';
import { Config } from './config.js';

class MultiplayerScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MultiplayerScene' });
        this.networkManager = null;
        this.gameManager = null;
        this.uiManager = null;
        this.board = null;
        this.isMyTurn = false;
        this.gameStarted = false;
        this.playerData = null;
        this.opponentData = null;
        this.waitingText = null;
        this.connectionStatus = null;
        this.chatMessages = [];
    }

    preload() {
        // Reuse assets from MenuScene
        this.load.image('bg', 'assets/capitol-conquest-splash-portrait.png');
    }

    create() {
        // Set up background
        const bg = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'bg');
        bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        // Initialize network manager
        this.networkManager = new NetworkManager();
        
        // Set up UI
        this.createUI();
        
        // Set up network event handlers
        this.setupNetworkHandlers();
        
        // Connect to server
        this.connectToServer();

        // Handle resize
        this.scale.on('resize', this.handleResize, this);
    }

    createUI() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Title
        this.add.text(centerX, 80, 'CAPITOL CONQUEST', {
            fontSize: '32px',
            fontFamily: 'Arial Black',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(centerX, 120, 'MULTIPLAYER', {
            fontSize: '24px',
            fontFamily: 'Arial',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Connection status
        this.connectionStatus = this.add.text(centerX, 160, 'Connecting to server...', {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Waiting message
        this.waitingText = this.add.text(centerX, centerY, '', {
            fontSize: '20px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Player info containers
        this.createPlayerInfoUI();

        // Back button
        const backButton = this.add.rectangle(100, 50, 160, 40, 0x4169E1)
            .setInteractive()
            .on('pointerdown', () => this.goBack())
            .on('pointerover', () => backButton.setFillStyle(0x6495ED))
            .on('pointerout', () => backButton.setFillStyle(0x4169E1));

        this.add.text(100, 50, 'Back to Menu', {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Chat UI (initially hidden)
        this.createChatUI();
    }

    createPlayerInfoUI() {
        const centerX = this.cameras.main.centerX;
        
        // Player 1 info (left side)
        this.player1Info = this.add.container(centerX - 200, 200);
        this.player1Info.setVisible(false);
        
        // Player 2 info (right side)
        this.player2Info = this.add.container(centerX + 200, 200);
        this.player2Info.setVisible(false);
    }

    createChatUI() {
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;

        // Chat container (initially hidden)
        this.chatContainer = this.add.container(gameWidth - 250, gameHeight - 200);
        this.chatContainer.setVisible(false);

        // Chat background
        const chatBg = this.add.rectangle(0, 0, 240, 180, 0x000000, 0.7);
        this.chatContainer.add(chatBg);

        // Chat messages area
        this.chatMessagesText = this.add.text(-110, -70, '', {
            fontSize: '12px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            wordWrap: { width: 220 }
        });
        this.chatContainer.add(this.chatMessagesText);

        // Chat input (would need HTML input for real implementation)
        this.add.text(gameWidth - 250, gameHeight - 40, 'Chat: Press T to toggle', {
            fontSize: '12px',
            fontFamily: 'Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
    }

    setupNetworkHandlers() {
        this.networkManager.on('gameStarted', (data) => {
            this.handleGameStarted(data);
        });

        this.networkManager.on('waitingForOpponent', () => {
            this.waitingText.setText('Waiting for opponent...\n\nLooking for another player to join the game.');
            this.connectionStatus.setText('Connected - Searching for opponent');
        });

        this.networkManager.on('moveMade', (data) => {
            this.handleMoveMade(data);
        });

        this.networkManager.on('moveRejected', (data) => {
            this.showMessage(`Move rejected: ${data.error}`, '#ff0000');
        });

        this.networkManager.on('playerDisconnected', (data) => {
            this.showMessage('Opponent disconnected. Returning to menu...', '#ff0000');
            this.time.delayedCall(3000, () => this.goBack());
        });

        this.networkManager.on('chatMessage', (data) => {
            this.addChatMessage(`${data.player}: ${data.message}`);
        });

        this.networkManager.on('error', (data) => {
            this.showMessage(`Error: ${data.message}`, '#ff0000');
        });

        this.networkManager.on('disconnected', () => {
            this.connectionStatus.setText('Disconnected from server');
            this.showMessage('Connection lost. Returning to menu...', '#ff0000');
            this.time.delayedCall(3000, () => this.goBack());
        });
    }

    async connectToServer() {
        try {
            await this.networkManager.connect();
            this.connectionStatus.setText('Connected to server');
            
            // Join game with player name
            const playerName = this.getPlayerName();
            this.networkManager.joinGame(playerName);
            
        } catch (error) {
            console.error('Failed to connect:', error);
            this.connectionStatus.setText('Connection failed');
            this.waitingText.setText('Failed to connect to server.\n\nPlease check your internet connection\nand try again.');
            
            // Add retry button
            this.time.delayedCall(2000, () => {
                const retryButton = this.add.rectangle(this.cameras.main.centerX, this.cameras.main.centerY + 100, 120, 40, 0x4169E1)
                    .setInteractive()
                    .on('pointerdown', () => this.scene.restart());
                
                this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 100, 'Retry', {
                    fontSize: '16px',
                    fontFamily: 'Arial',
                    fill: '#ffffff'
                }).setOrigin(0.5);
            });
        }
    }

    getPlayerName() {
        // Try to get player name from localStorage or generate one
        let playerName = localStorage.getItem('playerName');
        if (!playerName) {
            playerName = `Player${Math.floor(Math.random() * 1000)}`;
            localStorage.setItem('playerName', playerName);
        }
        return playerName;
    }

    handleGameStarted(data) {
        console.log('Game started with data:', data);
        
        this.gameStarted = true;
        this.playerData = data.players.find(p => p.id === this.networkManager.socket.id);
        this.opponentData = data.players.find(p => p.id !== this.networkManager.socket.id);
        
        // Clear waiting message
        this.waitingText.setText('');
        
        // Update connection status
        this.connectionStatus.setText(`Playing as ${this.playerData.color} vs ${this.opponentData.name}`);
        
        // Show player info
        this.updatePlayerInfo();
        
        // Initialize game components
        this.initializeGame(data);
        
        // Update turn indicator
        this.updateTurnIndicator(data.currentPlayer);
        
        // Show chat
        this.chatContainer.setVisible(true);
    }

    updatePlayerInfo() {
        // Clear existing info
        this.player1Info.removeAll(true);
        this.player2Info.removeAll(true);
        
        // Player 1 (you)
        const player1Bg = this.add.rectangle(0, 0, 180, 80, this.playerData.color === 'blue' ? 0x0066cc : 0xcc0000, 0.8);
        const player1Name = this.add.text(0, -15, this.playerData.name, {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        const player1Label = this.add.text(0, 15, '(You)', {
            fontSize: '12px',
            fontFamily: 'Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        this.player1Info.add([player1Bg, player1Name, player1Label]);
        this.player1Info.setVisible(true);
        
        // Player 2 (opponent)
        const player2Bg = this.add.rectangle(0, 0, 180, 80, this.opponentData.color === 'blue' ? 0x0066cc : 0xcc0000, 0.8);
        const player2Name = this.add.text(0, -15, this.opponentData.name, {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        const player2Label = this.add.text(0, 15, '(Opponent)', {
            fontSize: '12px',
            fontFamily: 'Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        this.player2Info.add([player2Bg, player2Name, player2Label]);
        this.player2Info.setVisible(true);
    }

    initializeGame(data) {
        // Initialize game components with multiplayer data
        
        this.board = new Board(this, Config);
        this.uiManager = new UIManager(this, Config);
        this.gameManager = new GameManager(this.board, this.uiManager, this, { 
            mode: 'multiplayer'
        });
        
        // Set up multiplayer mode
        this.gameManager.setMultiplayerMode(true, this.networkManager);
        
        // Load initial game state
        if (data.gameState) {
            this.gameManager.loadGameState(data.gameState);
        }
        
        // Set up board click handlers
        this.board.hexMap.forEach(hex => {
            const hitPoly = hex.getData('hit');
            if (hitPoly) { // Only add listeners for interactive hexes (non-blocked)
                hitPoly.on('pointerdown', () => this.gameManager.onHexClicked(hex));
            }
        });
    }

    handleMoveMade(data) {
        // Update game state
        if (this.gameManager) {
            this.gameManager.applyMove(data.move, data.gameState);
        }
        
        // Update turn indicator
        this.updateTurnIndicator(data.currentPlayer);
        
        // Show move feedback
        const isMyMove = data.playerId === this.networkManager.playerId;
        const message = isMyMove ? 'Your move was accepted' : `${this.opponentData.name} made a move`;
        this.showMessage(message, isMyMove ? '#00ff00' : '#ffffff');
    }

    updateTurnIndicator(currentPlayer) {
        this.isMyTurn = this.networkManager.isMyTurn(currentPlayer);
        
        const turnText = this.isMyTurn ? 'Your Turn' : `${this.opponentData.name}'s Turn`;
        const turnColor = this.isMyTurn ? '#00ff00' : '#ffffff';
        
        if (this.turnIndicator) {
            this.turnIndicator.destroy();
        }
        
        this.turnIndicator = this.add.text(this.cameras.main.centerX, 300, turnText, {
            fontSize: '18px',
            fontFamily: 'Arial',
            fill: turnColor,
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
    }

    showMessage(text, color = '#ffffff') {
        // Create temporary message
        const message = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, text, {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: color,
            stroke: '#000000',
            strokeThickness: 1,
            align: 'center'
        }).setOrigin(0.5);
        
        // Fade out after 3 seconds
        this.tweens.add({
            targets: message,
            alpha: 0,
            duration: 3000,
            onComplete: () => message.destroy()
        });
    }

    addChatMessage(message) {
        this.chatMessages.push(message);
        
        // Keep only last 5 messages
        if (this.chatMessages.length > 5) {
            this.chatMessages.shift();
        }
        
        // Update chat display
        this.chatMessagesText.setText(this.chatMessages.join('\n'));
    }

    handleResize() {
        // Update UI positions on resize
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        
        if (this.waitingText) {
            this.waitingText.setPosition(centerX, centerY);
        }
        
        // Update other UI elements as needed
        if (this.gameManager) {
            this.gameManager.handleResize();
        }
    }

    goBack() {
        // Disconnect from server
        if (this.networkManager) {
            this.networkManager.disconnect();
        }
        
        // Return to menu
        this.scene.start('MenuScene');
    }

    destroy() {
        // Clean up
        if (this.networkManager) {
            this.networkManager.disconnect();
        }
        
        this.scale.off('resize', this.handleResize);
        super.destroy();
    }
}

// Export for ES6 modules
export { MultiplayerScene };
