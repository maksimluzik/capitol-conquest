import { Config } from '../config.js';

export class ChatUI {
  constructor(scene, sendMessage) {
    this.scene = scene;
    this.sendMessage = sendMessage;
    const style = Config.textStyle(Config.FONT_SIZES.SMALL, Config.COLORS.TEXT_WHITE);
    this.messages = [];
    this.text = scene.add.text(10, scene.scale.height - 10, '', style)
      .setOrigin(0, 1)
      .setDepth(200);

    if (typeof document !== 'undefined') {
      this.input = document.createElement('input');
      this.input.type = 'text';
      this.input.placeholder = 'Type message';
      Object.assign(this.input.style, {
        position: 'absolute',
        left: '10px',
        bottom: '10px',
        width: '200px'
      });
      this.input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && this.input.value.trim()) {
          this.sendMessage(this.input.value.trim());
          this.input.value = '';
        }
      });
      document.body.appendChild(this.input);
    }
  }

  addMessage({ playerId, message }) {
    this.messages.push(`P${playerId}: ${message}`);
    this.text.setText(this.messages.slice(-5).join('\n'));
  }
}
