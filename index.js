import { GameScene } from './src/GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: 900,
  height: 800,
  backgroundColor: '#f2f2f2',
  scene: [GameScene]
};

new Phaser.Game(config);
