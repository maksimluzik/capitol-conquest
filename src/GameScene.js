// GameScene.js - primary Phaser scene
import { Board } from './Board.js';
import { GameManager } from './GameManager.js';
import { UIManager } from './UIManager.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  init(data) { this.vsAI = data?.vsAI; }
  preload() {}

  create() {
    this.board = new Board(this, { size: 5, hexSize: 36 }); // slightly smaller radius for spacing
    this.board.generate();

    this.ui = new UIManager(this);
    this.gameManager = new GameManager(this.board, this.ui, this, { vsAI: this.vsAI });

    // Register hex clicks
    this.board.hexMap.forEach(hex => {
      const hitPoly = hex.getData('hit');
      hitPoly.on('pointerdown', () => this.gameManager.onHexClicked(hex));
    });

    this.gameManager.setupInitialPieces();
  }
}
