// UIManager.js - handles UI overlays and text
export class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.turnText = scene.add.text(16, 16, '', { fontSize: '22px', fontFamily: 'Arial', color: '#222' }).setDepth(100);
    this.scoreText = scene.add.text(16, 48, '', { fontSize: '18px', fontFamily: 'Arial', color: '#222' }).setDepth(100);
    this.gameOverText = null;
  }

  updateTurn(name) { this.turnText.setText(`Turn: ${name}`); }
  updateScores(score1, score2) { this.scoreText.setText(`Republicans: ${score1}\nDemocrats: ${score2}`); }

  flashTurn(name) {
    const w = this.scene.scale.width / 2;
    const h = this.scene.scale.height / 2;
    const txt = this.scene.add.text(w, h, `${name}' Turn`, {
      fontSize: '48px', fontFamily: 'Arial', color: '#000', backgroundColor: '#ffffff', padding: { x: 24, y: 12 }, align: 'center'
    }).setOrigin(0.5).setDepth(250).setAlpha(0);
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
    this.gameOverText = this.scene.add.text(w, h, `Game Over\n${msg}`, {
      fontSize: '48px', fontFamily: 'Arial', color: '#000', backgroundColor: '#ffffff', padding: { x: 24, y: 16 }, align: 'center'
    }).setOrigin(0.5).setDepth(200);
  }

  showCumulativeScores(scores) {
    // Display small footer panel with cumulative wins
    if (this.cumulativeText) this.cumulativeText.destroy();
    this.cumulativeText = this.scene.add.text(this.scene.scale.width - 16, 16,
      `Wins - Red: ${scores.red}  Blue: ${scores.blue}`,
      { fontSize: '16px', fontFamily: 'Arial', color: '#222' })
      .setOrigin(1,0).setDepth(120);
  }
}
