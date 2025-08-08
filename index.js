import { GameScene } from './src/GameScene.js';

// Ask the user if they want to face the computer before starting the game
const vsAI = window.confirm('Play against computer?');

const config = {
  type: Phaser.AUTO,
  width: 900,
  height: 800,
  backgroundColor: '#f2f2f2'
};

const game = new Phaser.Game(config);
game.scene.add('GameScene', GameScene);
game.scene.start('GameScene', { vsAI });
