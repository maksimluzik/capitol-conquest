// UIManager.js - manages in-game UI overlays
import { Config } from './config.js';

export class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.layout = Config.DEVICE.getMobileLayout(scene);
    
    // Responsive text positioning and sizing
    const fontSize = this.layout.isMobile ? '16px' : '20px';
    const titleFontSize = this.layout.isMobile ? '18px' : '24px';
    const padding = this.layout.padding;
    
    // Create stylish "Capitol Conquest" title similar to menu
    this.createStylishGameTitle(scene, padding, padding, titleFontSize, this.layout);
    
    // Position other UI elements below the title with proper spacing
    const titleHeight = this.layout.isMobile ? 35 : 45; // Increased spacing to prevent overlap
    this.turnText = scene.add.text(padding, padding + titleHeight, '', Config.textStyle(fontSize, Config.COLORS.TEXT_DARK)).setDepth(100);
    this.scoreText = scene.add.text(padding, padding + titleHeight + (this.layout.isMobile ? 32 : 48), '', 
      Config.textStyle(this.layout.isMobile ? Config.FONT_SIZES.MINI : Config.FONT_SIZES.TINY, Config.COLORS.TEXT_DARK)
    ).setDepth(100);
    this.gameOverText = null;
  }

  updateTurn(name) { this.turnText.setText(`Turn: ${name}`); }
  updateScores(score1, score2) { this.scoreText.setText(`Republicans: ${score1}\nDemocrats: ${score2}`); }

  createStylishGameTitle(scene, x, y, fontSize, layout) {
    // Create shadow layers for depth (smaller versions of menu title)
    this.titleShadow1 = scene.add.text(x + (layout.isMobile ? 1 : 2), y + (layout.isMobile ? 2 : 3), 'Capitol Conquest', 
      Config.textStyle(fontSize, '#000000', { 
        fontWeight: 'bold',
        fontFamily: 'serif'
      })
    ).setOrigin(0, 0).setDepth(98).setAlpha(0.3);
    
    this.titleShadow2 = scene.add.text(x + (layout.isMobile ? 0.5 : 1), y + (layout.isMobile ? 1 : 1.5), 'Capitol Conquest', 
      Config.textStyle(fontSize, '#000000', { 
        fontWeight: 'bold',
        fontFamily: 'serif'
      })
    ).setOrigin(0, 0).setDepth(99).setAlpha(0.5);
    
    // Create main title with golden color and stroke
    this.titleText = scene.add.text(x, y, 'Capitol Conquest', 
      Config.textStyle(fontSize, Config.COLORS.TEXT_BRIGHT_GOLD, {
        fontWeight: 'bold',
        fontFamily: 'serif',
        stroke: '#8B4513',
        strokeThickness: layout.isMobile ? 1 : 2
      })
    ).setOrigin(0, 0).setDepth(100);
    
    // Add highlight effect
    this.titleHighlight = scene.add.text(x, y - (layout.isMobile ? 0.3 : 0.5), 'Capitol Conquest', 
      Config.textStyle(fontSize, '#FFFFFF', {
        fontWeight: 'bold',
        fontFamily: 'serif',
        stroke: '#FFD700',
        strokeThickness: 0.5
      })
    ).setOrigin(0, 0).setDepth(101).setAlpha(0.6);
  }

  flashTurn(name) {
    const w = this.scene.scale.width / 2;
    const h = this.scene.scale.height / 2;
    const fontSize = this.layout.isMobile ? '24px' : '32px';
    const padding = this.layout.isMobile ? { x: 12, y: 6 } : { x: 20, y: 10 };
    
    const txt = this.scene.add.text(w, h, `${name}' Turn`,
      Config.textStyle(fontSize, Config.COLORS.TEXT_DARK, { 
        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
        padding: padding, 
        align: 'center' 
      })
    ).setOrigin(0.5).setDepth(250).setAlpha(0);
    this.scene.tweens.add({ targets: txt, alpha: { from: 0, to: 1 }, duration: 100, yoyo: false });
    this.scene.time.delayedCall(700, () => {
      this.scene.tweens.add({ targets: txt, alpha: 0, duration: 250, onComplete: () => txt.destroy() });
    });
  }

  showGameOver(winner) {
    if (this.gameOverText) return;
    const w = this.scene.scale.width / 2;
    const h = this.scene.scale.height / 2;
    const msg = winner ? `${winner.name} win!` : 'Draw!';
    this.gameOverText = this.scene.add.text(w, h, `Game Over\n${msg}`,
      Config.textStyle('48px', Config.COLORS.TEXT_DARK, { backgroundColor: Config.COLORS.TEXT_WHITE, padding: { x: 24, y: 16 }, align: 'center' })
    ).setOrigin(0.5).setDepth(200);
  }

  showCumulativeScores(scores) {
    // Display small footer panel with cumulative wins
    if (this.cumulativeText) this.cumulativeText.destroy();
    this.cumulativeText = this.scene.add.text(this.scene.scale.width - 16, 16,
      `Wins - Red: ${scores.red}  Blue: ${scores.blue}`,
      Config.textStyle(Config.FONT_SIZES.MINI, Config.COLORS.TEXT_WHITE))
      .setOrigin(1,0).setDepth(120);
  }

  addSkipButton(onSkip, onForfeit) {
    if (this.skipBtn) return this.skipBtn;
    
    // Calculate dynamic position based on score text position to avoid overlap
    const padding = this.layout.padding;
    const titleHeight = this.layout.isMobile ? 35 : 45;
    const scoreTextY = padding + titleHeight + (this.layout.isMobile ? 32 : 48);
    const buttonSpacing = this.layout.isMobile ? 20 : 25;
    const skipButtonY = scoreTextY + (this.layout.isMobile ? 40 : 60); // Give enough space below score text
    
    this.skipBtn = this.scene.add.text(padding, skipButtonY, '[Skip Turn]',
      Config.textStyle(Config.FONT_SIZES.TINY, Config.COLORS.TEXT_SILVER)
    ).setDepth(100).setInteractive({ useHandCursor: true });
    this.skipBtn.on('pointerover', () => this.skipBtn.setStyle({ color: Config.COLORS.TEXT_WHITE }));
    this.skipBtn.on('pointerout', () => this.skipBtn.setStyle({ color: Config.COLORS.TEXT_SILVER }));
    this.skipBtn.on('pointerdown', () => onSkip && onSkip());
    
    // Add forfeit button below skip button
    this.addForfeitButton(onForfeit);
    
    return this.skipBtn;
  }

  addForfeitButton(onForfeit) {
    if (this.forfeitBtn) return this.forfeitBtn;
    
    // Position relative to skip button with proper spacing
    const padding = this.layout.padding;
    const titleHeight = this.layout.isMobile ? 35 : 45;
    const scoreTextY = padding + titleHeight + (this.layout.isMobile ? 32 : 48);
    const buttonSpacing = this.layout.isMobile ? 20 : 25;
    const forfeitButtonY = scoreTextY + (this.layout.isMobile ? 60 : 85); // Below skip button
    
    this.forfeitBtn = this.scene.add.text(padding, forfeitButtonY, '[Forfeit Game]',
      Config.textStyle(Config.FONT_SIZES.TINY, Config.COLORS.TEXT_RED)
    ).setDepth(100).setInteractive({ useHandCursor: true });
    this.forfeitBtn.on('pointerover', () => this.forfeitBtn.setStyle({ color: Config.COLORS.TEXT_ORANGE }));
    this.forfeitBtn.on('pointerout', () => this.forfeitBtn.setStyle({ color: Config.COLORS.TEXT_RED }));
    this.forfeitBtn.on('pointerdown', () => this.showForfeitConfirmation(onForfeit));
    return this.forfeitBtn;
  }

  showForfeitConfirmation(onForfeit) {
    // Create modal overlay
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    
    this.forfeitModal = this.scene.add.container(0, 0);
    
    // Background overlay
    const overlay = this.scene.add.rectangle(w/2, h/2, w, h, Config.COLORS.OVERLAY_DARK, 0.7);
    overlay.setInteractive();
    
    // Confirmation dialog
    const dialogBg = this.scene.add.rectangle(w/2, h/2, 400, 200, 0xffffff, 1);
    dialogBg.setStrokeStyle(3, Config.COLORS.OVERLAY_DARK);
    
    // Title
    const title = this.scene.add.text(w/2, h/2 - 40, 'Forfeit Game?',
      Config.textStyle(Config.FONT_SIZES.NORMAL, Config.COLORS.TEXT_DARK, { fontWeight: 'bold' })
    ).setOrigin(0.5);
    
    // Message
    const message = this.scene.add.text(w/2, h/2 - 10, 'Are you sure you want to forfeit?\nThis will count as a loss.',
      Config.textStyle(Config.FONT_SIZES.TINY, Config.COLORS.TEXT_DARK, { align: 'center' })
    ).setOrigin(0.5);
    
    // Buttons
    const yesBtn = this.scene.add.text(w/2 - 60, h/2 + 40, 'Yes, Forfeit',
      Config.textStyle(Config.FONT_SIZES.TINY, Config.COLORS.TEXT_WHITE, { 
        backgroundColor: Config.COLORS.TEXT_RED, 
        padding: { x: 12, y: 8 } 
      })
    ).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    const noBtn = this.scene.add.text(w/2 + 60, h/2 + 40, 'Cancel',
      Config.textStyle(Config.FONT_SIZES.TINY, Config.COLORS.TEXT_WHITE, { 
        backgroundColor: Config.COLORS.PRIMARY, 
        padding: { x: 12, y: 8 } 
      })
    ).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    // Button interactions
    yesBtn.on('pointerover', () => yesBtn.setStyle({ backgroundColor: Config.COLORS.TEXT_ORANGE }));
    yesBtn.on('pointerout', () => yesBtn.setStyle({ backgroundColor: Config.COLORS.TEXT_RED }));
    yesBtn.on('pointerdown', () => {
      this.hideForfeitConfirmation();
      onForfeit && onForfeit();
    });
    
    noBtn.on('pointerover', () => noBtn.setStyle({ backgroundColor: Config.COLORS.BUTTON_HOVER }));
    noBtn.on('pointerout', () => noBtn.setStyle({ backgroundColor: Config.COLORS.PRIMARY }));
    noBtn.on('pointerdown', () => this.hideForfeitConfirmation());
    
    // Add all elements to modal
    this.forfeitModal.add([overlay, dialogBg, title, message, yesBtn, noBtn]);
    this.forfeitModal.setDepth(300);
    
    // Close on ESC key
    this.scene.input.keyboard.once('keydown-ESC', () => this.hideForfeitConfirmation());
  }

  hideForfeitConfirmation() {
    if (this.forfeitModal) {
      this.forfeitModal.destroy();
      this.forfeitModal = null;
    }
  }

  disableSkip() { 
    if (this.skipBtn) this.skipBtn.disableInteractive().setAlpha(0.4); 
    if (this.forfeitBtn) this.forfeitBtn.disableInteractive().setAlpha(0.4);
  }

  addBackToMenuButton(onMenu) {
    if (this.menuBtn) return this.menuBtn;
    const w = this.scene.scale.width / 2;
    const h = this.scene.scale.height / 2 + 80;
    this.menuBtn = this.scene.add.text(w, h, 'Back to Menu',
      Config.textStyle(Config.FONT_SIZES.NORMAL, Config.COLORS.TEXT_WHITE, { 
        backgroundColor: Config.COLORS.PRIMARY, 
        padding: { x: 20, y: 10 }, 
        align: 'center'
      })
    ).setOrigin(0.5).setDepth(210).setInteractive({ useHandCursor: true });
    this.menuBtn.on('pointerover', () => this.menuBtn.setStyle({ backgroundColor: Config.COLORS.BUTTON_HOVER }));
    this.menuBtn.on('pointerout', () => this.menuBtn.setStyle({ backgroundColor: Config.COLORS.PRIMARY }));
    this.menuBtn.on('pointerdown', () => onMenu && onMenu());
    return this.menuBtn;
  }
  
  handleResize(width, height) {
    // Update layout for new dimensions
    this.layout = Config.DEVICE.getMobileLayout(this.scene);
    
    // Reposition UI elements
    const fontSize = this.layout.isMobile ? '16px' : '20px';
    const titleFontSize = this.layout.isMobile ? '18px' : '24px';
    const padding = this.layout.padding;
    const titleHeight = this.layout.isMobile ? 35 : 45;
    
    // Reposition all title elements (shadow layers and main title)
    if (this.titleShadow1) {
      this.titleShadow1.setPosition(padding + (this.layout.isMobile ? 1 : 2), padding + (this.layout.isMobile ? 2 : 3));
      this.titleShadow1.setStyle({ fontSize: titleFontSize });
    }
    
    if (this.titleShadow2) {
      this.titleShadow2.setPosition(padding + (this.layout.isMobile ? 0.5 : 1), padding + (this.layout.isMobile ? 1 : 1.5));
      this.titleShadow2.setStyle({ fontSize: titleFontSize });
    }
    
    if (this.titleText) {
      this.titleText.setPosition(padding, padding);
      this.titleText.setStyle({ fontSize: titleFontSize });
    }
    
    if (this.titleHighlight) {
      this.titleHighlight.setPosition(padding, padding - (this.layout.isMobile ? 0.3 : 0.5));
      this.titleHighlight.setStyle({ fontSize: titleFontSize });
    }
    
    if (this.turnText) {
      this.turnText.setPosition(padding, padding + titleHeight);
      this.turnText.setStyle({ fontSize: fontSize });
    }
    
    if (this.scoreText) {
      this.scoreText.setPosition(padding, padding + titleHeight + (this.layout.isMobile ? 32 : 48));
      this.scoreText.setStyle({ fontSize: this.layout.isMobile ? Config.FONT_SIZES.MINI : Config.FONT_SIZES.TINY });
    }
    
    // Reposition buttons if they exist - use same dynamic positioning as creation
    if (this.skipBtn || this.forfeitBtn) {
      const scoreTextY = padding + titleHeight + (this.layout.isMobile ? 32 : 48);
      
      if (this.skipBtn) {
        const skipButtonY = scoreTextY + (this.layout.isMobile ? 40 : 60);
        this.skipBtn.setPosition(padding, skipButtonY);
      }
      if (this.forfeitBtn) {
        const forfeitButtonY = scoreTextY + (this.layout.isMobile ? 60 : 85);
        this.forfeitBtn.setPosition(padding, forfeitButtonY);
      }
    }
    
    // Reposition menu button if it exists
    if (this.menuBtn) {
      this.menuBtn.setPosition(width/2, height/2 + 80);
    }
  }
}
