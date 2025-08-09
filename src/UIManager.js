// UIManager.js - manages in-game UI overlays
import { Config } from './config.js';

export class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.turnText = scene.add.text(16, 16, '', Config.textStyle('22px', Config.COLORS.TEXT_DARK)).setDepth(100);
    this.scoreText = scene.add.text(16, 48, '', Config.textStyle(Config.FONT_SIZES.TINY, Config.COLORS.TEXT_DARK)).setDepth(100);
    this.gameOverText = null;
  }

  updateTurn(name) { this.turnText.setText(`Turn: ${name}`); }
  updateScores(score1, score2) { this.scoreText.setText(`Republicans: ${score1}\nDemocrats: ${score2}`); }

  flashTurn(name) {
    const w = this.scene.scale.width / 2;
    const h = this.scene.scale.height / 2;
    const txt = this.scene.add.text(w, h, `${name}' Turn`,
      Config.textStyle('32px', Config.COLORS.TEXT_DARK, { backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: { x: 20, y: 10 }, align: 'center' })
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
    const msg = winner ? `${winner.name} wins!` : 'Draw!';
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
    const y = 92;
    this.skipBtn = this.scene.add.text(16, y, '[Skip Turn]',
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
    const y = 118; // Below skip button
    this.forfeitBtn = this.scene.add.text(16, y, '[Forfeit Game]',
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
}
