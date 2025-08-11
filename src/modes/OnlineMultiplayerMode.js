import { BaseMode } from './BaseMode.js';
import { NetworkClient } from '../online/NetworkClient.js';
import { ChatUI } from '../online/ChatUI.js';
import { Config } from '../config.js';

export class OnlineMultiplayerMode extends BaseMode {
  setup() {
    this.createWaitingRoomUI();
    
    // Disable board interaction until game starts
    this.scene.board.hexMap.forEach(hex => hex.getData('hit')?.disableInteractive?.());

    this.network = new NetworkClient(this.scene);
    this.setupNetworkEvents();

    // Initialize chat (will be hidden during waiting room)
    this.chat = new ChatUI(this.scene, msg => this.network.sendChat(msg));
    this.chat.hide(); // Hide chat initially

    this.network.connect();
  }

  // Override to prevent automatic initial piece setup in online mode
  shouldSetupInitialPieces() {
    return false;
  }

  // Get player restrictions for online mode
  getGameManagerOptions() {
    return {
      mode: 'online',
      networkPlayerId: this.network?.playerId || null,
      // Defer piece setup to network state
      skipInitialPieces: true
    };
  }

  createWaitingRoomUI() {
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;
    
    // Create waiting room container
    this.waitingRoomContainer = this.scene.add.container(0, 0);
    this.waitingRoomContainer.setDepth(300);
    
    // Background overlay
    this.overlay = this.scene.add.rectangle(
      centerX, centerY,
      this.scene.scale.width, this.scene.scale.height,
      0x000000, 0.8
    );
    this.waitingRoomContainer.add(this.overlay);
    
    // Main status text
    const titleStyle = Config.textStyle(Config.FONT_SIZES.LARGE, Config.COLORS.TEXT_WHITE);
    this.statusText = this.scene.add.text(centerX, centerY - 100, 'Connecting...', titleStyle)
      .setOrigin(0.5);
    this.waitingRoomContainer.add(this.statusText);
    
    // Player status area
    const playerStyle = Config.textStyle(Config.FONT_SIZES.MEDIUM, Config.COLORS.TEXT_LIGHT);
    this.playerStatusText = this.scene.add.text(centerX, centerY - 20, '', playerStyle)
      .setOrigin(0.5);
    this.waitingRoomContainer.add(this.playerStatusText);
    
    // Loading animation dots
    this.loadingDots = this.scene.add.text(centerX, centerY + 40, '', 
      Config.textStyle(Config.FONT_SIZES.MEDIUM, Config.COLORS.TEXT_WHITE))
      .setOrigin(0.5);
    this.waitingRoomContainer.add(this.loadingDots);
    
    // Cancel button
    const buttonStyle = Config.textStyle(Config.FONT_SIZES.MEDIUM, Config.COLORS.TEXT_WHITE);
    this.cancelButton = this.scene.add.text(centerX, centerY + 120, 'Cancel', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.cancelMatchmaking())
      .on('pointerover', () => this.cancelButton.setTint(0xff6666))
      .on('pointerout', () => this.cancelButton.clearTint());
    this.waitingRoomContainer.add(this.cancelButton);
    
    // Start loading animation
    this.startLoadingAnimation();
  }

  setupNetworkEvents() {
    this.scene.events.on('net-joined', (data) => {
      this.statusText.setText('Connected to Server');
      this.playerStatusText.setText(`You are Player ${data.playerId}`);
      
      // Update the GameManager with the network player ID
      if (this.scene.gameManager) {
        this.scene.gameManager.setNetworkPlayerId(data.playerId);
      }
    });

    this.scene.events.on('net-waiting', () => {
      this.statusText.setText('Waiting for Opponent');
      this.playerStatusText.setText('Looking for another player...');
    });

    this.scene.events.on('net-matchFound', () => {
      this.statusText.setText('Opponent Found!');
      this.playerStatusText.setText('Match found! Preparing game...');
      this.stopLoadingAnimation();
      this.startCountdown();
    });

    this.scene.events.on('net-startGame', () => {
      this.hideWaitingRoom();
      this.enableBoard();
      this.showChat();
      
      // Update UI with current player info and show which player you are
      this.scene.gameManager.updateScores();
      
      const myPlayerId = this.scene.gameManager.networkPlayerId;
      const currentPlayer = this.scene.gameManager.currentPlayer;
      const isMyTurn = myPlayerId === currentPlayer;
      
      console.log(`Game started: I am player ${myPlayerId}, current turn: ${currentPlayer}, my turn: ${isMyTurn}`);
      
      // Update turn display with player identity
      const playerName = this.scene.gameManager.players[currentPlayer].name;
      this.scene.gameManager.ui.updateTurn(
        isMyTurn ? `Your Turn (${playerName})` : `Opponent's Turn (${playerName})`
      );
      
      this.scene.gameManager.ui.updateScores(
        this.scene.gameManager.players[1].score, 
        this.scene.gameManager.players[2].score
      );
    });

    this.scene.events.on('net-chatMessage', data => {
      this.chat.addMessage(data);
    });

    this.scene.events.on('net-opponentLeft', () => {
      this.showOpponentLeftMessage();
    });

    this.scene.events.on('net-connectionError', () => {
      this.showConnectionError();
    });
  }

  startCountdown() {
    let count = 3;
    this.statusText.setText(`Game Starting in ${count}...`);
    this.playerStatusText.setText('Get ready!');
    
    const countdownTimer = this.scene.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        count--;
        if (count > 0) {
          this.statusText.setText(`Game Starting in ${count}...`);
        } else {
          this.statusText.setText('Starting Game!');
        }
      }
    });
  }

  startLoadingAnimation() {
    let dots = 0;
    this.loadingTimer = this.scene.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        dots = (dots + 1) % 4;
        this.loadingDots.setText('.'.repeat(dots));
      }
    });
  }

  stopLoadingAnimation() {
    if (this.loadingTimer) {
      this.loadingTimer.destroy();
      this.loadingDots.setText('');
    }
  }

  hideWaitingRoom() {
    if (this.waitingRoomContainer) {
      this.waitingRoomContainer.setVisible(false);
    }
    this.stopLoadingAnimation();
  }

  showChat() {
    if (this.chat) {
      this.chat.show();
    }
  }

  cancelMatchmaking() {
    // Disconnect from network and return to menu
    if (this.network && this.network.socket) {
      this.network.socket.disconnect();
    }
    this.scene.scene.start('MenuScene');
  }

  showOpponentLeftMessage() {
    // Show message and return to menu after delay
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;
    
    const messageStyle = Config.textStyle(Config.FONT_SIZES.LARGE, Config.COLORS.TEXT_WHITE);
    const messageText = this.scene.add.text(centerX, centerY, 'Opponent Left\nReturning to Menu...', messageStyle)
      .setOrigin(0.5)
      .setDepth(400);
    
    this.scene.time.delayedCall(3000, () => {
      this.scene.scene.start('MenuScene');
    });
  }

  showConnectionError() {
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;
    
    this.statusText.setText('Connection Failed');
    this.playerStatusText.setText('Unable to connect to server');
    this.loadingDots.setText('');
    
    // Show retry button
    const retryStyle = Config.textStyle(Config.FONT_SIZES.MEDIUM, Config.COLORS.TEXT_WHITE);
    const retryButton = this.scene.add.text(centerX, centerY + 80, 'Retry', retryStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        retryButton.destroy();
        this.network.connect();
        this.statusText.setText('Connecting...');
        this.playerStatusText.setText('');
        this.startLoadingAnimation();
      })
      .on('pointerover', () => retryButton.setTint(0x66ff66))
      .on('pointerout', () => retryButton.clearTint());
    
    this.waitingRoomContainer.add(retryButton);
  }

  enableBoard() {
    // Re-enable all hex interactions
    this.scene.board.hexMap.forEach(hex => {
      const hitPoly = hex.getData('hit');
      if (hitPoly) {
        hitPoly.setInteractive();
      }
    });
    
    console.log('Board interaction enabled for online multiplayer');
  }

  cleanup() {
    this.stopLoadingAnimation();
    if (this.network && this.network.socket) {
      this.network.socket.disconnect();
    }
    if (this.chat) {
      this.chat.cleanup();
    }
  }
}
