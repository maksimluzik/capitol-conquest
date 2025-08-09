// GameScene.js - primary Phaser scene
import { Board } from './Board.js';
import { GameManager } from './GameManager.js';
import { UIManager } from './UIManager.js';
import { AI } from './AI.js';
import { Config } from './config.js';

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
    // data: { mode: 'single' | 'two', playerChoice? }
    this.mode = data?.mode || 'two';
    this.playerChoice = data?.playerChoice || null; // { playerId, playerColor, aiColor }
    
    // Initialize music if needed
    this.initializeMusic();
    
    // Initialize sound effects
    this.initializeSounds();
    
    this.startGame();
  }

  startGame() {
    this.board = new Board(this, { size: 5, hexSize: 36 });
    this.board.generate();
    this.ui = new UIManager(this);
    const gmOptions = { 
      mode: this.mode,
      playerChoice: this.playerChoice // Pass player choice for global stats
    };
    // Override player colors if choice present
    if (this.playerChoice && this.mode === 'single') {
      gmOptions.players = {
        1: { id:1, name:'Republicans', color: (this.playerChoice.playerId===1? this.playerChoice.playerColor : this.playerChoice.aiColor), score:0, isAI:false },
        2: { id:2, name:'Democrats', color: (this.playerChoice.playerId===2? this.playerChoice.playerColor : this.playerChoice.aiColor), score:0, isAI:false }
      };
      gmOptions.humanPlayerId = this.playerChoice.playerId; // ensure GameManager knows which side is human
    }
    this.gameManager = new GameManager(this.board, this.ui, this, gmOptions);
    if (this.mode === 'single') {
      const aiId = this.playerChoice ? (this.playerChoice.playerId === 1 ? 2 : 1) : (gmOptions.humanPlayerId === 1 ? 2 : 1);
  this.aiPlayer = new AI(aiId);
    }
    this.board.hexMap.forEach(hex => {
      const hitPoly = hex.getData('hit');
      if (hitPoly) { // Only add listeners for interactive hexes (non-blocked)
        hitPoly.on('pointerdown', () => this.gameManager.onHexClicked(hex));
      }
    });
    this.gameManager.setupInitialPieces();
  // Add skip turn UI and forfeit functionality
  this.ui.addSkipButton(() => this.gameManager.skipTurn(), () => this.gameManager.forfeitGame());
  this.input.keyboard.on('keydown-S', () => this.gameManager.skipTurn());
  this.input.keyboard.on('keydown-F', () => this.gameManager.forfeitGame()); // F key for forfeit
  
  // Add music toggle button
  this.addMusicToggle();
  }
  
  initializeMusic() {
    // Continue playing music from MenuScene if available
    if (this.game.music?.background && this.game.music.isPlaying && !this.game.music.background.isPlaying) {
      this.game.music.background.play();
    }
  }
  
  initializeSounds() {
    // Initialize sound effects with volume control
    this.sounds = {
      pieceMove: this.sound.add('pieceMove', { volume: 0.5 }),
      pieceJump: this.sound.add('pieceJump', { volume: 0.5 }),
      convert: this.sound.add('convertSound', { volume: 0.4 })
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
    
    this.musicToggle = this.add.text(w - 20, 20, musicIcon, 
      Config.textStyle(Config.FONT_SIZES.MEDIUM, Config.COLORS.TEXT_WHITE)
    ).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(200);
    
    this.musicToggle.on('pointerdown', () => this.toggleMusic());
    this.musicToggle.on('pointerover', () => this.musicToggle.setScale(1.2));
    this.musicToggle.on('pointerout', () => this.musicToggle.setScale(1.0));
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
}
