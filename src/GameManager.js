// GameManager.js - game state, turns, move validation
export class GameManager {
  constructor(board, ui, scene, options = {}) {
    this.board = board;
    this.ui = ui;
    this.scene = scene;
    this.players = options.players || {
      1: { id: 1, name: 'Republicans', color: 0xd94343, score: 0 },
      2: { id: 2, name: 'Democrats', color: 0x3a52d9, score: 0 }
    };
    this.currentPlayer = 1;
    this.selectedPiece = null;
    this.validMoves = [];
    this.tokenLayer = scene.add.layer();
  }

  setupInitialPieces() {
    const s = this.board.size;
    this.addPiece(-s, 0, 1);
    this.addPiece(s, 0, 2);
    this.addPiece(0, -s, 1);
    this.addPiece(0, s, 2);
    this.addPiece(-s, s, 1);
    this.addPiece(s, -s, 2);
    this.updateScores();
    this.ui.updateTurn(this.players[this.currentPlayer].name);
    this.ui.updateScores(this.players[1].score, this.players[2].score);
  }

  addPiece(q, r, playerId) {
    const hex = this.board.getHex(q, r);
    if (!hex) return;
    const { x, y } = this.hexCenter(hex);
    const token = this.drawToken(x, y, this.board.hexSize * 0.55, this.players[playerId].color);
    token.setData({ q, r, player: playerId });
    token.setInteractive({ useHandCursor: true });
    token.on('pointerdown', () => this.onPieceDown(token));
    hex.setData('piece', token);
  }

  drawToken(cx, cy, radius, baseColor) {
    const g = this.scene.add.graphics();
    // Base circle with gradient-like layered fills
    const colors = [baseColor, 0xffffff];
    const gradientSteps = 4;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / (gradientSteps - 1);
      const mix = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(colors[0]),
        Phaser.Display.Color.IntegerToColor(colors[1]),
        gradientSteps - 1,
        i
      );
      const col = Phaser.Display.Color.GetColor(mix.r, mix.g, mix.b);
      g.fillStyle(col, 0.25 + 0.75 * (1 - t));
      g.fillCircle(cx, cy, radius * (1 - 0.15 * t));
    }
    // Bevel highlight arc
    g.lineStyle(2, 0xffffff, 0.6);
    g.beginPath();
    g.arc(cx, cy, radius * 0.75, Phaser.Math.DegToRad(220), Phaser.Math.DegToRad(320));
    g.strokePath();
    // Shadow
    g.fillStyle(0x000000, 0.15);
    g.fillCircle(cx + radius * 0.15, cy + radius * 0.15, radius * 0.8);
    g.setDepth(10);
    return g;
  }

  hexCenter(hexGraphics) {
    // Prefer stored center coordinates placed on the hex's data.
    const data = hexGraphics.data?.values;
    if (data && typeof data.cx === 'number' && typeof data.cy === 'number') {
      return { x: data.cx, y: data.cy };
    }
    // Fallback: approximate via geometry reconstruction (should not usually run).
    // Attempt to use the hit polygon if present.
    const hit = hexGraphics.getData?.('hit');
    if (hit) return { x: hit.x, y: hit.y };
    // Last resort: origin (0,0)
    return { x: 0, y: 0 };
  }

  onPieceDown(piece) {
    if (piece.data.values.player !== this.currentPlayer) return;
    if (this.selectedPiece === piece) return; // already selected
    this.clearHighlights();
    this.selectedPiece = piece;
    this.computeValidMoves();
    this.highlightValidMoves();
  }

  clearHighlights() {
    this.validMoves.forEach(m => {
      const hex = this.board.getHex(m.q, m.r);
      if (hex) {
        // Could redraw; for now no-op since we didn't tint.
      }
    });
    this.validMoves = [];
  }

  directionsDuplicate() { return [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]]; }
  directionsJump() { return [
    [2,0],[-2,0],[0,2],[0,-2],[2,-2],[-2,2],
    [1,1],[-1,-1],[1,-2],[-1,2],[2,-1],[-2,1]
  ]; }

  computeValidMoves() {
    if (!this.selectedPiece) return;
    const { q, r } = this.selectedPiece.data.values;
    const testDirs = (dirs, type) => {
      dirs.forEach(([dq, dr]) => {
        const nq = q + dq, nr = r + dr;
        const hex = this.board.getHex(nq, nr);
        if (hex && !hex.data.values.piece) this.validMoves.push({ q: nq, r: nr, type });
      });
    };
    testDirs(this.directionsJump(), 'jump');
    testDirs(this.directionsDuplicate(), 'duplicate');
  }

  highlightValidMoves() {
    this.validMoves.forEach(m => {
      const hex = this.board.getHex(m.q, m.r);
      if (!hex) return;
      const color = (m.type === 'jump') ? 0x42d977 : 0xd9d142;
      const overlay = this.scene.add.circle(0,0,0,0); // placeholder if future effect
      // For clarity we could add pulses; skipping for brevity.
    });
  }

  onHexClicked(hex) {
    if (!this.selectedPiece) return;
    const { q, r } = hex.data.values;
    const move = this.validMoves.find(v => v.q === q && v.r === r);
    if (!move) return;
    this.executeMove(move);
  }

  executeMove(move) {
    const player = this.selectedPiece.data.values.player;
    const oldQ = this.selectedPiece.data.values.q;
    const oldR = this.selectedPiece.data.values.r;

    if (move.type === 'jump') {
      const oldHex = this.board.getHex(oldQ, oldR);
      oldHex?.setData('piece', null);
      this.selectedPiece.destroy();
    }
    // Duplicate keeps original piece

    this.addPiece(move.q, move.r, player);
    this.convertAdjacent(move.q, move.r, player);
    this.clearHighlights();
    this.selectedPiece = null;
    this.endTurn();
  }

  convertAdjacent(q, r, player) {
    this.directionsDuplicate().forEach(([dq, dr]) => {
      const hex = this.board.getHex(q + dq, r + dr);
      if (hex && hex.data.values.piece && hex.data.values.piece.data.values.player !== player) {
        // Replace piece
        hex.data.values.piece.destroy();
        this.addPiece(q + dq, r + dr, player);
      }
    });
  }

  updateScores() {
    this.players[1].score = 0; this.players[2].score = 0;
    this.board.forEachHex(hex => {
      const piece = hex.data.values.piece;
      if (piece) this.players[piece.data.values.player].score++;
    });
  }

  endTurn() {
    this.updateScores();
    this.ui.updateScores(this.players[1].score, this.players[2].score);
    this.currentPlayer = (this.currentPlayer === 1) ? 2 : 1;
    this.ui.updateTurn(this.players[this.currentPlayer].name);
    if (this.checkGameOver()) this.ui.showGameOver(this.getWinner());
  }

  hasMovesForPlayer(pid) {
    for (const hex of this.board.hexMap.values()) {
      const piece = hex.data.values.piece;
      if (piece && piece.data.values.player === pid) {
        if (this.pieceHasMoves(piece)) return true;
      }
    }
    return false;
  }

  pieceHasMoves(piece) {
    const { q, r } = piece.data.values;
    const dirs = [...this.directionsDuplicate(), ...this.directionsJump()];
    for (const [dq, dr] of dirs) {
      const hex = this.board.getHex(q + dq, r + dr);
      if (hex && !hex.data.values.piece) return true;
    }
    return false;
  }

  boardFull() {
    for (const hex of this.board.hexMap.values()) {
      if (!hex.data.values.piece) return false;
    }
    return true;
  }

  checkGameOver() {
    if (this.boardFull()) return true;
    if (!this.hasMovesForPlayer(1) && !this.hasMovesForPlayer(2)) return true;
    return false;
  }

  getWinner() {
    if (this.players[1].score === this.players[2].score) return null;
    return this.players[1].score > this.players[2].score ? this.players[1] : this.players[2];
  }
}
