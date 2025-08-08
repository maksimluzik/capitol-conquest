import { GameScene } from './src/GameScene.js';
import { MenuScene, HelpScene } from './src/MenuScene.js';

const config = {
  type: Phaser.AUTO,
  width: 900,
  height: 800,
  backgroundColor: '#f2f2f2',
  scene: [MenuScene, HelpScene, GameScene]
};

new Phaser.Game(config);
