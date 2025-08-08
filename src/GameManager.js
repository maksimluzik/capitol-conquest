// GameManager.js - game state, turns, move validation (AI handled internally)
import { addWinByColor, loadScores } from './PersistentScores.js';

export class GameManager {
  constructor(board, ui, scene, options = {}) {
    this.board = board;
    this.ui = ui;
    this.scene = scene;
    this.players = options.players || {
      1: { id: 1, name: 'Republicans', color: 0xd94343, score: 0, isAI: false },
      2: { id: 2, name: 'Democrats', color: 0x3a52d9, score: 0, isAI: false }
    };
    this.humanPlayerId = options.humanPlayerId || 1; // default human is player 1
    if (options.mode === 'single' || options.vsAI) {
      // Mark the non-human player as AI
      this.players[1].isAI = (this.humanPlayerId !== 1);
      this.players[2].isAI = (this.humanPlayerId !== 2);
    }
    this.currentPlayer = this.humanPlayerId; // human always starts
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
    const pieceRadius = this.board.hexSize * 0.55;
    const token = this.drawToken(x, y, pieceRadius, this.players[playerId].color);
    token.setData({ q, r, player: playerId });
    // Explicit hit area in local space (token draws at 0,0 after refactor)
    token.setInteractive(new Phaser.Geom.Circle(0, 0, pieceRadius), Phaser.Geom.Circle.Contains, { useHandCursor: true });
    token.on('pointerdown', () => this.onPieceDown(token));
    hex.setData('piece', token);
  }

  drawToken(cx, cy, radius, baseColor) {
    const g = this.scene.add.graphics();
    // Position at center; subsequent drawing uses local coordinates
    g.x = cx;
    g.y = cy;
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
      g.fillCircle(0, 0, radius * (1 - 0.15 * t));
    }
    // Bevel highlight arc
    g.lineStyle(2, 0xffffff, 0.6);
    g.beginPath();
    g.arc(0, 0, radius * 0.75, Phaser.Math.DegToRad(220), Phaser.Math.DegToRad(320));
    g.strokePath();
    // Shadow
    g.fillStyle(0x000000, 0.15);
    g.fillCircle(radius * 0.15, radius * 0.15, radius * 0.8);
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
  if (this.players[this.currentPlayer].isAI) return;
    if (piece.data.values.player !== this.currentPlayer) return;
    if (this.selectedPiece === piece) return; // already selected
    this.clearHighlights();
    this.selectedPiece = piece;
    this.computeValidMoves();
    this.highlightValidMoves();
    this.showSelectionRing(piece);
  }

  clearHighlights() {
    // original clearing of validMoves
    if (this.moveOverlays) {
      this.moveOverlays.forEach(o => o.destroy());
    }
    this.moveOverlays = [];
    this.validMoves = [];
    if (this.selectionRing) { this.selectionRing.destroy(); this.selectionRing = null; }
  }

  directionsDuplicate() { return [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]]; }
  directionsJump() { return [
    [2,0],[-2,0],[0,2],[0,-2],[2,-2],[-2,2],
    [1,1],[-1,-1],[1,-2],[-1,2],[2,-1],[-2,1]
  ]; }

  computeValidMoves() {
    if (!this.selectedPiece) return;
    const { q, r } = this.selectedPiece.data.values;
    // Explore a radius-2 neighborhood and classify by axial distance
    for (let dq = -2; dq <= 2; dq++) {
      for (let dr = -2; dr <= 2; dr++) {
        const nq = q + dq;
        const nr = r + dr;
        if (dq === 0 && dr === 0) continue;
        const dist = this.axialDistance(q, r, nq, nr);
        if (dist > 2) continue; // only up to jump distance
        const hex = this.board.getHex(nq, nr);
        if (!hex || hex.data.values.piece) continue; // must be empty
        const type = (dist === 1) ? 'duplicate' : (dist === 2 ? 'jump' : null);
        if (!type) continue;
        this.validMoves.push({ q: nq, r: nr, type });
      }
    }
  }

  axialDistance(q1, r1, q2, r2) {
    // Cube coords: x = q, z = r, y = -x - z
    const x1 = q1, z1 = r1, y1 = -x1 - z1;
    const x2 = q2, z2 = r2, y2 = -x2 - z2;
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2), Math.abs(z1 - z2));
  }

  highlightValidMoves() {
    this.moveOverlays = [];
    this.validMoves.forEach(m => {
      const hex = this.board.getHex(m.q, m.r);
      if (!hex) return;
      const { x, y } = this.hexCenter(hex);
      // Swap color semantics: duplicate (adjacent) => green, jump (distance 2) => yellow
      const color = (m.type === 'duplicate') ? 0x42d977 : 0xd9d142;
      const g = this.scene.add.graphics();
      g.x = x; g.y = y;
      g.lineStyle(2, color, 0.9);
      g.strokeCircle(0, 0, this.board.hexSize * 0.55 * (m.type === 'jump' ? 1.15 : 0.9));
      g.setDepth(5);
      // Make highlight clickable for convenience
      const radius = this.board.hexSize * 0.55 * (m.type === 'jump' ? 1.15 : 0.9);
      g.setInteractive(new Phaser.Geom.Circle(0,0,radius), Phaser.Geom.Circle.Contains);
      g.on('pointerdown', () => {
        if (!this.selectedPiece) return;
        // Execute move directly
        this.executeMove(m);
      });
      this.moveOverlays.push(g);
    });
  }

  onHexClicked(hex) {
    if (this.players[this.currentPlayer].isAI) return;
    const piece = hex.data.values.piece;
    if (!this.selectedPiece) {
      if (piece && piece.data.values.player === this.currentPlayer) {
        this.selectPiece(piece);
      }
      return;
    }
    if (piece && piece === this.selectedPiece) return; // clicking same piece
    const { q, r } = hex.data.values;
    const move = this.validMoves.find(v => v.q === q && v.r === r);
    if (!move) {
      if (piece && piece.data.values.player === this.currentPlayer) {
        this.selectPiece(piece, true);
      }
      return;
    }
    this.executeMove(move);
  }

  selectPiece(piece, reselect = false) {
    this.clearHighlights();
    this.selectedPiece = piece;
    this.computeValidMoves();
    this.highlightValidMoves();
    this.showSelectionRing(piece, reselect);
  }

  showSelectionRing(piece, reselect) {
    if (this.selectionRing) { this.selectionRing.destroy(); this.selectionRing = null; }
    const radius = this.board.hexSize * 0.55 * 1.1;
    const ring = this.scene.add.graphics();
    ring.x = piece.x;
    ring.y = piece.y;
    ring.lineStyle(3, 0xffff66, 0.9);
    ring.strokeCircle(0, 0, radius);
    ring.setDepth(9);
    if (reselect) {
      this.scene.tweens.add({ targets: ring, alpha: { from: 0.3, to: 1 }, duration: 180, yoyo: true, repeat: 1 });
    }
    this.selectionRing = ring;
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
  this.updateScores();
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
  if (this.checkGameOver()) { this._finalizeGame(); return; }
    this.currentPlayer = (this.currentPlayer === 1) ? 2 : 1;
    this.ui.updateTurn(this.players[this.currentPlayer].name);
    this.ui.flashTurn(this.players[this.currentPlayer].name);
  if (this.scene.mode === 'single' && this.players[this.currentPlayer].isAI && this.scene.aiPlayer) {
      // Let UI update before AI moves
      this.scene.time.delayedCall(350, () => this.aiTurn(), [], this);
    }
  }

  skipTurn() {
    // Allow only human to skip own turn
    if (this.players[this.currentPlayer].isAI) return;
    this.clearHighlights();
    this.selectedPiece = null;
    this.endTurn();
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
    const c1 = this.countPieces(1);
    const c2 = this.countPieces(2);
    if (c1 === 0 || c2 === 0) return true; // one side eliminated
    if (!this.hasMovesForPlayer(1) && !this.hasMovesForPlayer(2)) return true; // mutual stalemate
    return false;
  }

  countPieces(pid) {
    let n = 0; this.board.hexMap.forEach(hex => { const p = hex.data.values.piece; if (p && p.data.values.player === pid) n++; }); return n;
  }

  _finalizeGame() {
    const winner = this.getWinner();
    this.ui.showGameOver(winner);
    // Disable input
    this.board.hexMap.forEach(hex => hex.getData('hit')?.disableInteractive?.());
    // Persist win if any
    if (winner) {
      addWinByColor(winner.color);
      const scores = loadScores();
      this.ui.showCumulativeScores(scores);
    }
  }

  aiTurn() {
    if (!this.scene.aiPlayer) return;
    // Decide best move
    const move = this.scene.aiPlayer.decideMove(this);
    if (!move) { // no moves for AI
      if (this.checkGameOver()) this._finalizeGame(); else this.endTurn();
      return;
    }
    const srcHex = this.board.getHex(move.fromQ, move.fromR);
    this.selectedPiece = srcHex?.data.values.piece || null;
    if (!this.selectedPiece) { this.endTurn(); return; }
    this.executeMove({ q: move.toQ, r: move.toR, type: move.type });
  }

  getWinner() {
    if (this.players[1].score === this.players[2].score) return null;
    return this.players[1].score > this.players[2].score ? this.players[1] : this.players[2];
  }
}
