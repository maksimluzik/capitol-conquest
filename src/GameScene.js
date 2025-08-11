// GameScene.js - primary Phaser scene
import { Board } from './Board.js';
import { GameManager } from './GameManager.js';
import { UIManager } from './UIManager.js';
import { Config } from './config.js';
import { createModeHandler } from './modes/index.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  init(data) { this.vsAI = data?.vsAI; }
  preload() {
    // Load sound effects
    this.load.audio('pieceMove', Config.ASSETS.PIECE_MOVE_SOUND);
    this.load.audio('pieceJump', Config.ASSETS.PIECE_JUMP_SOUND);
    this.load.audio('convertSound', Config.ASSETS.CONVERT_SOUND);
  }

  create(data) {
    // data: { mode: 'single' | 'two' | 'online', playerChoice?, difficulty? }
    this.mode = data?.mode || 'two';
    this.playerChoice = data?.playerChoice || null; // { playerId, playerColor, aiColor }
    this.difficulty = data?.difficulty || Config.DIFFICULTY.DEFAULT; // AI difficulty
    
    // Initialize music if needed
    this.initializeMusic();
    
    // Initialize sound effects
    this.initializeSounds();
    
    this.startGame();
  }

  startGame() {
    // Get responsive layout settings
    const layout = Config.DEVICE.getMobileLayout(this);
    
    // Create responsive board using config values
    const boardSize = layout.isMobile ? Config.BOARD.MOBILE_SIZE : Config.BOARD.DESKTOP_SIZE;
    const hexSize = layout.isMobile ? Config.BOARD.HEX_SIZE.MOBILE : Config.BOARD.HEX_SIZE.DESKTOP;
    
    this.board = new Board(this, { size: boardSize, hexSize: hexSize });
    this.board.generate();
    this.ui = new UIManager(this);

    const baseOptions = {
      mode: this.mode,
      playerChoice: this.playerChoice,
      difficulty: this.difficulty
    };
    // Create mode handler and allow it to customize GameManager options
    this.modeHandler = createModeHandler(this.mode, this, baseOptions);
    const gmOptions = this.modeHandler?.getGameManagerOptions
      ? this.modeHandler.getGameManagerOptions()
      : baseOptions;

    this.gameManager = new GameManager(this.board, this.ui, this, gmOptions);

    // Let mode perform any additional setup (AI, networking, etc.)
    this.modeHandler?.setup?.();

    this.board.hexMap.forEach(hex => {
      const hitPoly = hex.getData('hit');
      if (hitPoly) { // Only add listeners for interactive hexes (non-blocked)
        hitPoly.on('pointerdown', () => this.gameManager.onHexClicked(hex));
      }
    });
    
    // Only setup initial pieces if the mode allows it (online mode will get pieces from server)
    if (!this.modeHandler?.shouldSetupInitialPieces || this.modeHandler.shouldSetupInitialPieces()) {
      this.gameManager.setupInitialPieces();
    }

    // Add skip turn UI and forfeit functionality
    this.ui.addSkipButton(() => this.gameManager.skipTurn(), () => this.gameManager.forfeitGame());
    this.input.keyboard.on('keydown-S', () => this.gameManager.skipTurn());
    this.input.keyboard.on('keydown-F', () => this.gameManager.forfeitGame()); // F key for forfeit

    // Add music toggle button
    this.addMusicToggle();

    // Add resize listener for mobile viewport changes
    this.scale.on('resize', this.handleResize, this);
  }
  
  handleResize(gameSize, baseSize, displaySize, resolution) {
    // Handle resize for mobile devices
    const layout = Config.DEVICE.getMobileLayout(this);
    if (layout.isMobile) {
      // Update UI elements for new dimensions
      if (this.ui) {
        this.ui.handleResize(gameSize.width, gameSize.height);
      }
      
      // Recreate scene for significant layout changes if needed
      const aspectRatioChange = Math.abs(
        (gameSize.width / gameSize.height) - (this.lastAspectRatio || gameSize.width / gameSize.height)
      ) > Config.UI.RESIZE_ASPECT_RATIO_THRESHOLD;
      
      if (aspectRatioChange) {
        this.lastAspectRatio = gameSize.width / gameSize.height;
        // Store game state before restart
        const gameState = this.gameManager ? this.gameManager.getGameState() : null;
        this.scene.restart({ 
          mode: this.mode, 
          playerChoice: this.playerChoice, 
          difficulty: this.difficulty,
          gameState: gameState 
        });
      }
    }
  }
  
  initializeMusic() {
    // Continue playing music from MenuScene if available
    if (this.game.music?.background && this.game.music.isPlaying && !this.game.music.background.isPlaying) {
      this.game.music.background.play();
    }
  }
  
  initializeSounds() {
    // Initialize sound effects with volume control from config
    this.sounds = {
      pieceMove: this.sound.add('pieceMove', { volume: Config.AUDIO.VOLUMES.PIECE_MOVE }),
      pieceJump: this.sound.add('pieceJump', { volume: Config.AUDIO.VOLUMES.PIECE_JUMP }),
      convert: this.sound.add('convertSound', { volume: Config.AUDIO.VOLUMES.CONVERT })
    };
  }
  
  // Public methods for GameManager to call
  playMoveSound() {
    if (this.sounds?.pieceMove) {
      this.sounds.pieceMove.play();
    }
  }
  
  playJumpSound() {
    if (this.sounds?.pieceJump) {
      this.sounds.pieceJump.play();
    }
  }
  
  playConvertSound() {
    if (this.sounds?.convert) {
      this.sounds.convert.play();
    }
  }
  
  addMusicToggle() {
    if (!this.game.music) return;
    
    const w = this.scale.width;
    const musicIcon = this.game.music.isPlaying ? '🎵' : '🔇';
    
    this.musicToggle = this.add.text(
      w - Config.UI.MUSIC_TOGGLE_OFFSET, 
      Config.UI.MUSIC_TOGGLE_OFFSET, 
      musicIcon, 
      Config.textStyle(Config.FONT_SIZES.MEDIUM, Config.COLORS.TEXT_WHITE)
    ).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(Config.UI.MUSIC_TOGGLE_DEPTH);
    
    this.musicToggle.on('pointerdown', () => this.toggleMusic());
    this.musicToggle.on('pointerover', () => this.musicToggle.setScale(Config.UI.MUSIC_TOGGLE_SCALE_HOVER));
    this.musicToggle.on('pointerout', () => this.musicToggle.setScale(Config.UI.MUSIC_TOGGLE_SCALE_NORMAL));
  }
  
  toggleMusic() {
    if (!this.game.music?.background) return;
    
    this.game.music.isPlaying = !this.game.music.isPlaying;
    
    if (this.game.music.isPlaying) {
      this.game.music.background.play();
      this.musicToggle.setText('🎵');
    } else {
      this.game.music.background.pause();
      this.musicToggle.setText('🔇');
    }
    
    localStorage.setItem('musicEnabled', this.game.music.isPlaying.toString());
  }
  
  /**
   * Get AI configuration based on difficulty level
   */
  getAIOptions(difficulty) {
    const baseWeights = Config.AI.BASE_WEIGHTS;
    
    switch (difficulty.difficulty) {
      case 'hard':
        return {
          weights: {
            ...baseWeights,
            ...Config.AI.DIFFICULTY_WEIGHTS.HARD
          }
        };
      case 'expert':
        return {
          weights: {
            ...baseWeights,
            ...Config.AI.DIFFICULTY_WEIGHTS.EXPERT
          }
        };
      default: // normal
        return { weights: baseWeights };
    }
  }
}
