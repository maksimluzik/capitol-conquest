// GameScene.js - primary Phaser scene
import { Board } from './Board.js';
import { GameManager } from './GameManager.js';
import { UIManager } from './UIManager.js';
import { AIPlayer } from './AIPlayer.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  init(data) { this.vsAI = data?.vsAI; }
  preload() {}

  create(data) {
    // data: { mode: 'single' | 'two' }
    this.mode = data?.mode || 'two';
    this.startGame();
  }

  startGame() {
    this.board = new Board(this, { size: 5, hexSize: 36 });
    this.board.generate();
    this.ui = new UIManager(this);
    this.gameManager = new GameManager(this.board, this.ui, this, { mode: this.mode });
    if (this.mode === 'single') {
      this.aiPlayer = new AIPlayer(2); // AI controls player 2 (blue)
    }
    this.board.hexMap.forEach(hex => {
      const hitPoly = hex.getData('hit');
      hitPoly.on('pointerdown', () => this.gameManager.onHexClicked(hex));
    });
    this.gameManager.setupInitialPieces();
  }
}
