import test from 'node:test';
import assert from 'node:assert/strict';

import { createModeHandler, SinglePlayerMode, LocalMultiplayerMode, OnlineMultiplayerMode } from '../src/modes/index.js';
import { Config } from '../src/config.js';
import { AI } from '../src/AI.js';
import { NetworkClient } from '../src/online/NetworkClient.js';
import { ChatUI } from '../src/online/ChatUI.js';

// Utility stub for chat UI expectations
function createStubSceneForChat() {
  return {
    add: {
      text: () => ({
        setOrigin() { return this; },
        setDepth() { return this; }
      })
    },
    scale: { height: 600 }
  };
}

test('createModeHandler returns correct mode instances', () => {
  const scene = {};
  assert.ok(createModeHandler('single', scene) instanceof SinglePlayerMode);
  assert.ok(createModeHandler('two', scene) instanceof LocalMultiplayerMode);
  assert.ok(createModeHandler('online', scene) instanceof OnlineMultiplayerMode);
});

test('SinglePlayerMode.setup creates AI player', () => {
  const scene = {
    getAIOptions: () => ({ weights: {} }),
    gameManager: { humanPlayerId: 1 }
  };
  const mode = new SinglePlayerMode(scene, { difficulty: Config.DIFFICULTY.DEFAULT });
  assert.equal(scene.aiPlayer, undefined);
  mode.setup();
  assert.ok(scene.aiPlayer instanceof AI);
});

test('SinglePlayerMode.getGameManagerOptions sets player options', () => {
  const choice = { playerId: 2, playerColor: 0x111111, aiColor: 0x222222 };
  const mode = new SinglePlayerMode({}, { playerChoice: choice });
  const opts = mode.getGameManagerOptions();
  assert.equal(opts.humanPlayerId, 2);
  assert.equal(opts.players[1].color, choice.aiColor);
  assert.equal(opts.players[2].color, choice.playerColor);
});

test('OnlineMultiplayerMode.setup initializes network and chat', () => {
  const scene = createStubSceneForChat();
  const mode = new OnlineMultiplayerMode(scene, {});
  mode.setup();
  assert.ok(mode.network instanceof NetworkClient);
  assert.ok(mode.chat instanceof ChatUI);
});
