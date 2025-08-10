import { SinglePlayerMode } from './SinglePlayerMode.js';
import { LocalMultiplayerMode } from './LocalMultiplayerMode.js';
import { OnlineMultiplayerMode } from './OnlineMultiplayerMode.js';

export function createModeHandler(mode, scene, options) {
  switch (mode) {
    case 'single':
      return new SinglePlayerMode(scene, options);
    case 'online':
      return new OnlineMultiplayerMode(scene, options);
    case 'two':
    default:
      return new LocalMultiplayerMode(scene, options);
  }
}

export { SinglePlayerMode, LocalMultiplayerMode, OnlineMultiplayerMode };
