import { BaseMode } from './BaseMode.js';
import { NetworkClient } from '../online/NetworkClient.js';
import { ChatUI } from '../online/ChatUI.js';
import { Config } from '../config.js';

export class OnlineMultiplayerMode extends BaseMode {
  setup() {
    const style = Config.textStyle(Config.FONT_SIZES.MEDIUM, Config.COLORS.TEXT_WHITE);
    this.statusText = this.scene.add.text(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2,
      'Connecting...',
      style
    ).setOrigin(0.5).setDepth(200);

    // Disable board interaction until game starts
    this.scene.board.hexMap.forEach(hex => hex.getData('hit')?.disableInteractive?.());

    this.network = new NetworkClient(this.scene);

    this.scene.events.on('net-waiting', () => {
      this.statusText.setText('Waiting for opponent...');
    });

    this.scene.events.on('net-matchFound', () => {
      this.statusText.setText('Opponent found!');
      this.startCountdown();
    });

    this.scene.events.on('net-startGame', () => {
      this.statusText.destroy();
      this.enableBoard();
    });

    this.chat = new ChatUI(this.scene, msg => this.network.sendChat(msg));

    this.scene.events.on('net-chatMessage', data => {
      this.chat.addMessage(data);
    });

    this.network.connect();
  }

  startCountdown() {
    let count = 3;
    this.statusText.setText(`Game starting in ${count}...`);
    this.scene.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        count--;
        if (count > 0) {
          this.statusText.setText(`Game starting in ${count}...`);
        }
      }
    });
  }

  enableBoard() {
    this.scene.board.hexMap.forEach(hex => hex.getData('hit')?.setInteractive?.());
  }
}
