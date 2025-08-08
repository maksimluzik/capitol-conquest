// GameScene.js - primary Phaser scene
import { Board } from './Board.js';
import { GameManager } from './GameManager.js';
import { UIManager } from './UIManager.js';
import { AI } from './AI.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  init(data) { this.vsAI = data?.vsAI; }
  preload() {}

  create(data) {
    // data: { mode: 'single' | 'two', playerChoice? }
    this.mode = data?.mode || 'two';
    this.playerChoice = data?.playerChoice || null; // { playerId, playerColor, aiColor }
    this.startGame();
  }

  startGame() {
    this.board = new Board(this, { size: 5, hexSize: 36 });
    this.board.generate();
    this.ui = new UIManager(this);
    const gmOptions = { mode: this.mode };
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
  // Add skip turn UI and keyboard shortcut
  this.ui.addSkipButton(() => this.gameManager.skipTurn());
  this.input.keyboard.on('keydown-S', () => this.gameManager.skipTurn());
  }
}
