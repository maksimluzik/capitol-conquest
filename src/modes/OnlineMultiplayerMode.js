import { BaseMode } from './BaseMode.js';
import { NetworkClient } from '../online/NetworkClient.js';
import { ChatUI } from '../online/ChatUI.js';
import { Config } from '../config.js';

export class OnlineMultiplayerMode extends BaseMode {
  setup() {
    this.createWaitingRoomUI();
    
    // Disable board interaction until game starts - with null checks
    if (this.scene.board && this.scene.board.hexMap) {
      this.scene.board.hexMap.forEach(hex => {
        const hitPoly = hex.getData('hit');
        if (hitPoly && hitPoly.disableInteractive) {
          hitPoly.disableInteractive();
        }
      });
    } else {
      console.warn('OnlineMultiplayerMode: Board not ready yet, interactions will be disabled when board is available');
    }

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
      if (this.statusText) {
        this.statusText.setText('Connected to Server');
      }
      if (this.playerStatusText) {
        this.playerStatusText.setText(`You are Player ${data.playerId}`);
      }
      
      // Update the GameManager with the network player ID
      if (this.scene.gameManager) {
        this.scene.gameManager.setNetworkPlayerId(data.playerId);
      }
    });

    this.scene.events.on('net-waiting', () => {
      if (this.statusText) {
        this.statusText.setText('Waiting for Opponent');
      }
      if (this.playerStatusText) {
        this.playerStatusText.setText('Looking for another player...');
      }
    });

    this.scene.events.on('net-matchFound', () => {
      if (this.statusText) {
        this.statusText.setText('Opponent Found!');
      }
      if (this.playerStatusText) {
        this.playerStatusText.setText('Match found! Preparing game...');
      }
      this.stopLoadingAnimation();
      this.startCountdown();
    });

    this.scene.events.on('net-startGame', () => {
      this.hideWaitingRoom();
      this.enableBoard();
      this.showChat();
      
      // Update UI with current player info and show which player you are
      this.scene.gameManager.updateScores();
      
      console.log(`Game started: I am player ${this.scene.gameManager.networkPlayerId}, current turn: ${this.scene.gameManager.currentPlayer}`);
      
      // Use the consistent turn display method
      this.scene.gameManager.updateOnlineTurnDisplay();
      // Update visual states of pieces for the initial turn
      this.scene.gameManager.updatePieceVisualStates();
      
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
    if (this.statusText) {
      this.statusText.setText(`Game Starting in ${count}...`);
    }
    if (this.playerStatusText) {
      this.playerStatusText.setText('Get ready!');
    }
    
    const countdownTimer = this.scene.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        count--;
        if (count > 0) {
          if (this.statusText) {
            this.statusText.setText(`Game Starting in ${count}...`);
          }
        } else {
          if (this.statusText) {
            this.statusText.setText('Starting Game!');
          }
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
    // Create a prominent overlay for the disconnect message
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;
    
    // Create semi-transparent background overlay
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
    overlay.setDepth(500);
    
    // Main message
    const messageStyle = Config.textStyle(Config.FONT_SIZES.LARGE, Config.COLORS.TEXT_RED);
    const messageText = this.scene.add.text(centerX, centerY - 40, '⚠️ OPPONENT DISCONNECTED', messageStyle)
      .setOrigin(0.5)
      .setDepth(501);
    
    // Secondary message
    const subMessageStyle = Config.textStyle(Config.FONT_SIZES.MEDIUM, Config.COLORS.TEXT_WHITE);
    const subMessageText = this.scene.add.text(centerX, centerY + 20, 'Your opponent has left the game\nReturning to menu in 5 seconds...', subMessageStyle)
      .setOrigin(0.5)
      .setAlign('center')
      .setDepth(501);
    
    // Return to menu button (immediate option)
    const buttonStyle = Config.textStyle(Config.FONT_SIZES.SMALL, Config.COLORS.TEXT_YELLOW);
    const returnButton = this.scene.add.text(centerX, centerY + 100, '[Return to Menu Now]', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(501)
      .on('pointerover', () => returnButton.setStyle({ color: Config.COLORS.TEXT_WHITE }))
      .on('pointerout', () => returnButton.setStyle({ color: Config.COLORS.TEXT_YELLOW }))
      .on('pointerdown', () => {
        this.scene.scene.start('MenuScene');
      });
    
    // Auto-return after 5 seconds
    this.scene.time.delayedCall(5000, () => {
      this.scene.scene.start('MenuScene');
    });
  }

  showConnectionError() {
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;
    
    if (this.statusText) {
      this.statusText.setText('Connection Failed');
    }
    if (this.playerStatusText) {
      this.playerStatusText.setText('Unable to connect to server');
    }
    if (this.loadingDots) {
      this.loadingDots.setText('');
    }
    
    // Show retry button
    const retryStyle = Config.textStyle(Config.FONT_SIZES.MEDIUM, Config.COLORS.TEXT_WHITE);
    const retryButton = this.scene.add.text(centerX, centerY + 80, 'Retry', retryStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        retryButton.destroy();
        this.network.connect();
        if (this.statusText) {
          this.statusText.setText('Connecting...');
        }
        if (this.playerStatusText) {
          this.playerStatusText.setText('');
        }
        this.startLoadingAnimation();
      })
      .on('pointerover', () => retryButton.setTint(0x66ff66))
      .on('pointerout', () => retryButton.clearTint());
    
    this.waitingRoomContainer.add(retryButton);
  }

  enableBoard() {
    // Re-enable all hex interactions with proper null checks
    if (this.scene.board && this.scene.board.hexMap) {
      this.scene.board.hexMap.forEach(hex => {
        const hitPoly = hex.getData('hit');
        if (hitPoly && hitPoly.setInteractive) {
          hitPoly.setInteractive();
        }
      });
      console.log('Board interaction enabled for online multiplayer');
    } else {
      console.warn('OnlineMultiplayerMode: Cannot enable board - board not available');
    }
  }

  cleanup() {
    this.stopLoadingAnimation();
    
    // Remove all scene event listeners to prevent stale references
    if (this.scene && this.scene.events) {
      this.scene.events.off('net-joined');
      this.scene.events.off('net-waiting');
      this.scene.events.off('net-matchFound');
      this.scene.events.off('net-startGame');
      this.scene.events.off('net-chatMessage');
      this.scene.events.off('net-opponentLeft');
      this.scene.events.off('net-connectionError');
    }
    
    if (this.network && this.network.socket) {
      this.network.socket.disconnect();
    }
    if (this.chat) {
      this.chat.cleanup();
    }
    
    // Clean up UI elements
    if (this.waitingRoomContainer) {
      this.waitingRoomContainer.destroy();
      this.waitingRoomContainer = null;
    }
    
    // Clear references to prevent memory leaks
    this.statusText = null;
    this.playerStatusText = null;
    this.loadingDots = null;
    this.cancelButton = null;
  }
}
