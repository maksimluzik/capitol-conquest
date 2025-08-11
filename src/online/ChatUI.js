import { Config } from '../config.js';

export class ChatUI {
  constructor(scene, sendMessage) {
    this.scene = scene;
    this.sendMessage = sendMessage;
    this.isVisible = false;
    this.messages = [];
    
    this.createChatUI();
  }

  createChatUI() {
    const style = Config.textStyle(Config.FONT_SIZES.SMALL, Config.COLORS.TEXT_WHITE);
    
    // Chat messages display
    this.messagesText = this.scene.add.text(10, this.scene.scale.height - 120, '', style)
      .setOrigin(0, 1)
      .setDepth(200)
      .setVisible(false);
    
    // Chat input (HTML element for better UX)
    if (typeof document !== 'undefined') {
      this.createHTMLInput();
    }
  }

  createHTMLInput() {
    this.inputContainer = document.createElement('div');
    Object.assign(this.inputContainer.style, {
      position: 'absolute',
      left: '10px',
      bottom: '10px',
      display: 'none',
      zIndex: '1000'
    });

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = 'Type message and press Enter...';
    Object.assign(this.input.style, {
      width: '300px',
      padding: '5px',
      fontSize: '14px',
      backgroundColor: 'rgba(0,0,0,0.8)',
      color: 'white',
      border: '1px solid #666',
      borderRadius: '4px'
    });

    this.input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && this.input.value.trim()) {
        this.sendMessage(this.input.value.trim());
        this.input.value = '';
      }
      // Prevent game controls from triggering while typing
      e.stopPropagation();
    });

    this.inputContainer.appendChild(this.input);
    document.body.appendChild(this.inputContainer);
  }

  show() {
    this.isVisible = true;
    if (this.messagesText) {
      this.messagesText.setVisible(true);
    }
    if (this.inputContainer) {
      this.inputContainer.style.display = 'block';
    }
  }

  hide() {
    this.isVisible = false;
    if (this.messagesText) {
      this.messagesText.setVisible(false);
    }
    if (this.inputContainer) {
      this.inputContainer.style.display = 'none';
    }
  }

  addMessage({ playerId, message }) {
    const playerName = playerId === 1 ? 'Player 1' : 'Player 2';
    this.messages.push(`${playerName}: ${message}`);
    
    // Keep only last 5 messages
    if (this.messages.length > 5) {
      this.messages.shift();
    }
    
    if (this.messagesText) {
      this.messagesText.setText(this.messages.join('\n'));
    }
  }

  cleanup() {
    if (this.inputContainer && this.inputContainer.parentNode) {
      this.inputContainer.parentNode.removeChild(this.inputContainer);
    }
  }
}
