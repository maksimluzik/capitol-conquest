import { BaseMode } from './BaseMode.js';
import { AI } from '../AI.js';
import { Config } from '../config.js';

export class SinglePlayerMode extends BaseMode {
  getGameManagerOptions() {
    const base = { ...this.options };
    if (base.playerChoice) {
      base.players = {
        1: {
          id: 1,
          name: 'Republicans',
          color: base.playerChoice.playerId === 1 ? base.playerChoice.playerColor : base.playerChoice.aiColor,
          score: 0,
          isAI: false
        },
        2: {
          id: 2,
          name: 'Democrats',
          color: base.playerChoice.playerId === 2 ? base.playerChoice.playerColor : base.playerChoice.aiColor,
          score: 0,
          isAI: false
        }
      };
      base.humanPlayerId = base.playerChoice.playerId;
    }
    return base;
  }

  setup() {
    const gm = this.scene.gameManager;
    const aiId = gm.humanPlayerId === 1 ? 2 : 1;
    const aiOptions = this.scene.getAIOptions(this.options.difficulty || Config.DIFFICULTY.DEFAULT);
    this.scene.aiPlayer = new AI(aiId, aiOptions);
  }
}
