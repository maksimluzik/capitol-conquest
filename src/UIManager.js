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
      Config.textStyle('32px', '#000', { backgroundColor: 'rgba(255, 255, 255, 0.6)', padding: { x: 20, y: 10 }, align: 'center' })
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
      Config.textStyle('48px', '#000', { backgroundColor: '#ffffff', padding: { x: 24, y: 16 }, align: 'center' })
    ).setOrigin(0.5).setDepth(200);
  }

  showCumulativeScores(scores) {
    // Display small footer panel with cumulative wins
    if (this.cumulativeText) this.cumulativeText.destroy();
    this.cumulativeText = this.scene.add.text(this.scene.scale.width - 16, 16,
      `Wins - Red: ${scores.red}  Blue: ${scores.blue}`,
      Config.textStyle(Config.FONT_SIZES.MINI, Config.COLORS.TEXT_DARK))
      .setOrigin(1,0).setDepth(120);
  }

  addSkipButton(onSkip) {
    if (this.skipBtn) return this.skipBtn;
    const y = 92;
    this.skipBtn = this.scene.add.text(16, y, '[Skip Turn]',
      Config.textStyle(Config.FONT_SIZES.TINY, Config.COLORS.PRIMARY)
    ).setDepth(100).setInteractive({ useHandCursor: true });
    this.skipBtn.on('pointerover', () => this.skipBtn.setStyle({ color: '#d94343' }));
    this.skipBtn.on('pointerout', () => this.skipBtn.setStyle({ color: '#0a3d91' }));
    this.skipBtn.on('pointerdown', () => onSkip && onSkip());
    return this.skipBtn;
  }

  disableSkip() { if (this.skipBtn) this.skipBtn.disableInteractive().setAlpha(0.4); }

  addBackToMenuButton(onMenu) {
    if (this.menuBtn) return this.menuBtn;
    const w = this.scene.scale.width / 2;
    const h = this.scene.scale.height / 2 + 80;
    this.menuBtn = this.scene.add.text(w, h, 'Back to Menu',
      Config.textStyle(Config.FONT_SIZES.NORMAL, Config.COLORS.TEXT_LIGHT, { 
        backgroundColor: Config.COLORS.PRIMARY, 
        padding: { x: 20, y: 10 }, 
        align: 'center'
      })
    ).setOrigin(0.5).setDepth(210).setInteractive({ useHandCursor: true });
    this.menuBtn.on('pointerover', () => this.menuBtn.setStyle({ backgroundColor: '#d94343' }));
    this.menuBtn.on('pointerout', () => this.menuBtn.setStyle({ backgroundColor: '#0a3d91' }));
    this.menuBtn.on('pointerdown', () => onMenu && onMenu());
    return this.menuBtn;
  }
}
