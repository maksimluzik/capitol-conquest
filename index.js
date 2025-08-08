import { GameScene } from './src/GameScene.js';
import { MenuScene, HelpScene, ColorSelectScene } from './src/MenuScene.js';

const config = {
  type: Phaser.AUTO,
  width: 900,
  height: 800,
  backgroundColor: '#f2f2f2',
  scene: [MenuScene, HelpScene, ColorSelectScene, GameScene]
};

new Phaser.Game(config);
