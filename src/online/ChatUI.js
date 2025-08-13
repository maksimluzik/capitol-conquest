import { Config } from '../config.js';

export class ChatUI {
  constructor(scene, sendMessage) {
    this.scene = scene;
    this.sendMessage = sendMessage;
    this.isVisible = false;
    this.messages = [];
    this.messageTexts = []; // Array to hold individual colored text objects
    
    this.createChatUI();
  }

  createChatUI() {
    // Use a more visible color for chat - bright cyan/blue for base text
    const style = Config.textStyle(Config.FONT_SIZES.SMALL, '#000000');
    
    // Chat messages display - we'll use rich text to support different colors
    this.messagesText = this.scene.add.text(10, this.scene.scale.height - 120, '', {
      ...style,
      wordWrap: { width: 400 },
      lineSpacing: 4
    })
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
      width: '250px',
      padding: '8px',
      fontSize: '14px',
      backgroundColor: 'rgba(0,0,0,0.9)',
      color: '#00FFFF',
      border: '2px solid #0088CC',
      borderRadius: '6px',
      outline: 'none'
    });

    // Add a dismiss button for mobile users
    this.dismissButton = document.createElement('button');
    this.dismissButton.textContent = '✕';
    this.dismissButton.title = 'Dismiss keyboard';
    Object.assign(this.dismissButton.style, {
      marginLeft: '5px',
      padding: '8px 12px',
      fontSize: '14px',
      backgroundColor: 'rgba(255,0,0,0.8)',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer'
    });

    this.input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && this.input.value.trim()) {
        const message = this.input.value.trim();
        console.log('Sending chat message:', message);
        this.sendMessage(message);
        this.input.value = '';
        // Blur input after sending message to dismiss keyboard
        this.input.blur();
      } else if (e.key === 'Escape') {
        // Allow ESC key to dismiss keyboard
        this.input.blur();
      }
      // Prevent game controls from triggering while typing
      e.stopPropagation();
    });

    // Add dismiss button click handler
    this.dismissButton.addEventListener('click', () => {
      this.input.blur();
    });

    // Add touch event to dismiss keyboard when tapping outside
    this.inputContainer.addEventListener('touchstart', (e) => {
      e.stopPropagation();
    });

    // Create a backdrop that dismisses keyboard when tapped
    this.backdrop = document.createElement('div');
    Object.assign(this.backdrop.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      zIndex: '999',
      display: 'none'
    });

    this.backdrop.addEventListener('touchstart', () => {
      this.input.blur();
    });

    this.backdrop.addEventListener('click', () => {
      this.input.blur();
    });

    // Show/hide backdrop when input gains/loses focus
    this.input.addEventListener('focus', () => {
      this.backdrop.style.display = 'block';
    });

    this.input.addEventListener('blur', () => {
      this.backdrop.style.display = 'none';
    });

    this.inputContainer.appendChild(this.input);
    this.inputContainer.appendChild(this.dismissButton);
    document.body.appendChild(this.backdrop);
    document.body.appendChild(this.inputContainer);
  }

  show() {
    this.isVisible = true;
    if (this.messagesText) {
      this.messagesText.setVisible(false); // Keep old text hidden
    }
    // Show all individual message texts
    if (this.messageTexts) {
      this.messageTexts.forEach(text => text.setVisible(true));
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
    // Hide all individual message texts
    if (this.messageTexts) {
      this.messageTexts.forEach(text => text.setVisible(false));
    }
    if (this.inputContainer) {
      this.inputContainer.style.display = 'none';
    }
  }

  addMessage({ playerId, message }) {
    const playerName = playerId === 1 ? 'Republicans' : 'Democrats';
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Get party colors - Republicans (red) and Democrats (blue)
    const playerColor = playerId === 1 ? '#dc2626' : '#2563eb'; // Red for Republicans, Blue for Democrats
    
    // Create a formatted message with colored text
    const formattedMessage = `[${timestamp}] ${playerName}: ${message}`;
    this.messages.push({ text: formattedMessage, color: playerColor, playerId });
    
    // Keep only last 5 messages
    if (this.messages.length > 5) {
      this.messages.shift();
    }
    
    // Update the display with colored messages
    this.updateMessageDisplay();
    
    console.log('Chat message added:', {playerId, message});
  }

  updateMessageDisplay() {
    if (!this.messagesText) return;
    
    // Create a single text string with color markup for rich text
    // Since Phaser text doesn't easily support inline colors, we'll destroy and recreate
    if (this.messageTexts) {
      this.messageTexts.forEach(text => text.destroy());
    }
    this.messageTexts = [];
    
    // Hide the old text object
    this.messagesText.setVisible(false);
    
    // Create individual text objects for each message with their respective colors
    const startY = this.scene.scale.height - 120;
    const lineHeight = 25;
    
    this.messages.forEach((msg, index) => {
      const y = startY - (this.messages.length - 1 - index) * lineHeight;
      
      const messageText = this.scene.add.text(10, y, msg.text, {
        fontSize: Config.FONT_SIZES.SMALL,
        color: msg.color,
        fontFamily: 'Arial, sans-serif',
        wordWrap: { width: 400 },
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: { x: 4, y: 2 }
      })
        .setOrigin(0, 0)
        .setDepth(200)
        .setVisible(this.isVisible);
        
      this.messageTexts.push(messageText);
    });
  }

  cleanup() {
    if (this.inputContainer && this.inputContainer.parentNode) {
      this.inputContainer.parentNode.removeChild(this.inputContainer);
    }
    
    if (this.backdrop && this.backdrop.parentNode) {
      this.backdrop.parentNode.removeChild(this.backdrop);
    }
    
    // Clean up individual message texts
    if (this.messageTexts) {
      this.messageTexts.forEach(text => text.destroy());
      this.messageTexts = [];
    }
    
    // Clean up main message text
    if (this.messagesText) {
      this.messagesText.destroy();
      this.messagesText = null;
    }
  }
}
