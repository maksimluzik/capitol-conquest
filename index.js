import { GameScene } from './src/GameScene.js';
import { MenuScene, HelpScene, ColorSelectScene } from './src/MenuScene.js';
import { GlobalStatsScene } from './src/GlobalStatsScene.js';

const config = {
  type: Phaser.AUTO,
  width: 900,
  height: 900,
  backgroundColor: '#f2f2f2',
  scene: [MenuScene, HelpScene, ColorSelectScene, GlobalStatsScene, GameScene]
};

new Phaser.Game(config);
