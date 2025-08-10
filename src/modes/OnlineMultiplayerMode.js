import { BaseMode } from './BaseMode.js';
import { NetworkClient } from '../online/NetworkClient.js';
import { ChatUI } from '../online/ChatUI.js';

export class OnlineMultiplayerMode extends BaseMode {
  setup() {
    // Initialize networking and chat UI
    this.network = new NetworkClient(this.scene);
    this.network.connect();
    this.chat = new ChatUI(this.scene);
  }
}
