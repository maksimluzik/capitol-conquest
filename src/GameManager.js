// GameManager.js - game state, turns, move validation (AI handled internally)
import { addWinByColor, loadScores } from './PersistentScores.js';

export class GameManager {
  constructor(board, ui, scene, options = {}) {
    this.board = board;
    this.ui = ui;
    this.scene = scene;
    this.players = options.players || {
      1: { id: 1, name: 'Republicans', color: 0xdc2626, score: 0, isAI: false }, // Rich crimson red
      2: { id: 2, name: 'Democrats', color: 0x2563eb, score: 0, isAI: false }   // Royal blue
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
    this.gameEnded = false;
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

  addPiece(q, r, playerId, { animateSpawn = false } = {}) {
    const hex = this.board.getHex(q, r);
    if (!hex) return;
    const { x, y } = this.hexCenter(hex);
    const size = this.board.hexSize * 0.55;
    const piece = this.drawHexPiece(x, y, size, this.players[playerId].color);
    piece.setData({ q, r, player: playerId });
    piece.setInteractive(new Phaser.Geom.Polygon(piece.getData('polyPoints')), Phaser.Geom.Polygon.Contains, { useHandCursor: true });
    piece.on('pointerdown', () => this.onPieceDown(piece));
    if (animateSpawn) {
      piece.setScale(0);
      this.scene.tweens.add({ targets: piece, scale: 1, duration: 220, ease: 'Back.Out' });
    }
    hex.setData('piece', piece);
  }

  // Draw a hex-shaped game piece with pseudo 3D shading.
  drawHexPiece(cx, cy, radius, baseColor) {
    const g = this.scene.add.graphics();
    g.x = cx; g.y = cy;
    const rot = Phaser.Math.DegToRad(this.board.rotationDeg);
    const pts = [];
    for (let i=0;i<6;i++) {
      const ang = Phaser.Math.DegToRad(60*i - 30) + rot;
      pts.push({ x: radius * Math.cos(ang), y: radius * Math.sin(ang) });
    }
    // Store polygon points for hit testing (flattened relative coords)
    const polyPoints = pts.flatMap(p => [p.x, p.y]);
    g.setData('polyPoints', polyPoints);
  g.setData('pts', pts); // store for later redraw (conversion color tween)
  g.setData('radius', radius);
    // Shadow layer
    g.fillStyle(0x000000, 0.25);
    g.beginPath();
    g.moveTo(pts[0].x + 3, pts[0].y + 4);
    for (let i=1;i<6;i++) g.lineTo(pts[i].x + 3, pts[i].y + 4);
    g.closePath();
    g.fillPath();
    // Base
    g.lineStyle(2, 0x111111, 0.9);
    g.fillStyle(baseColor, 1);
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    for (let i=1;i<6;i++) g.lineTo(pts[i].x, pts[i].y);
    g.closePath(); g.fillPath(); g.strokePath();
    // Inner gradient approximation (concentric scaled hexes fading)
    const steps = 4;
    for (let s=1; s<=steps; s++) {
      const t = s/steps;
      const fade = 0.10 * (1-t);
      const scale = 1 - 0.18*t;
      g.fillStyle(0xffffff, fade);
      g.beginPath();
      pts.forEach((p,i)=> {
        const x = p.x * scale - 1.5 * (1-t);
        const y = p.y * scale - 1.0 * (1-t);
        if (i===0) g.moveTo(x,y); else g.lineTo(x,y);
      });
      g.closePath(); g.fillPath();
    }
    // Rim light top-left edges
    g.lineStyle(3, 0xffffff, 0.35);
    g.beginPath();
    g.moveTo(pts[5].x, pts[5].y);
    g.lineTo(pts[0].x, pts[0].y);
    g.lineTo(pts[1].x, pts[1].y);
    g.strokePath();
    // Subtle ambient occlusion bottom-right edge
    g.lineStyle(3, 0x000000, 0.25);
    g.beginPath();
    g.moveTo(pts[2].x, pts[2].y);
    g.lineTo(pts[3].x, pts[3].y);
    g.lineTo(pts[4].x, pts[4].y);
    g.strokePath();
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
  if (this.players[this.currentPlayer].isAI || this.gameEnded) return;
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
    if (this.players[this.currentPlayer].isAI || this.gameEnded) return;
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
      // Animate jump movement along an arced path then finalize at destination
      const movingPiece = this.selectedPiece;
      const oldHex = this.board.getHex(oldQ, oldR);
      oldHex?.setData('piece', null);
      const destHex = this.board.getHex(move.q, move.r);
      const { x: dx, y: dy } = this.hexCenter(destHex);
      const sx = movingPiece.x, sy = movingPiece.y;
      const arcHeight = this.board.hexSize * 0.9; // peak height
      const tweenObj = { t: 0 };
      this.scene.tweens.add({
        targets: tweenObj,
        t: 1,
        duration: 300,
        ease: 'Cubic.Out',
        onUpdate: () => {
          const t = tweenObj.t;
          movingPiece.x = Phaser.Math.Linear(sx, dx, t);
            // Arc via sine; peak at t=0.5
          const lift = Math.sin(Math.PI * t) * arcHeight;
          movingPiece.y = Phaser.Math.Linear(sy, dy, t) - lift;
        },
        onComplete: () => {
          movingPiece.x = dx; movingPiece.y = dy;
          movingPiece.setData({ q: move.q, r: move.r, player });
          destHex.setData('piece', movingPiece);
          this.convertAdjacent(move.q, move.r, player);
          this.updateScores();
          this.clearHighlights();
          this.selectedPiece = null;
          this.endTurn();
        }
      });
      return; // defer endTurn until animation complete
    } else {
      // Duplicate: spawn new piece with scale-in animation
      this.addPiece(move.q, move.r, player, { animateSpawn: true });
      this.convertAdjacent(move.q, move.r, player);
    }
    this.updateScores();
    this.clearHighlights();
    this.selectedPiece = null;
    this.endTurn();
  }

  convertAdjacent(q, r, player) {
    // Color tween + pulse existing piece rather than destroy/recreate instantly.
    this.directionsDuplicate().forEach(([dq, dr]) => {
      const hex = this.board.getHex(q + dq, r + dr);
      if (hex && hex.data.values.piece && hex.data.values.piece.data.values.player !== player) {
        const piece = hex.data.values.piece;
        const fromColor = this.players[piece.data.values.player].color;
        const toColor = this.players[player].color;
        piece.data.values.player = player;
        const fromCol = Phaser.Display.Color.IntegerToColor(fromColor);
        const toCol = Phaser.Display.Color.IntegerToColor(toColor);
        const pts = piece.getData('pts');
        this.scene.tweens.addCounter({
          from: 0,
          to: 100,
          duration: 260,
          ease: 'Sine.InOut',
          onUpdate: tw => {
            const t = tw.getValue()/100;
            const r = Phaser.Math.Linear(fromCol.red, toCol.red, t);
            const g = Phaser.Math.Linear(fromCol.green, toCol.green, t);
            const b = Phaser.Math.Linear(fromCol.blue, toCol.blue, t);
            const blended = Phaser.Display.Color.GetColor(r,g,b);
            piece.clear();
            // Shadow
            piece.fillStyle(0x000000,0.25); piece.beginPath(); piece.moveTo(pts[0].x+3,pts[0].y+4); for(let i=1;i<6;i++) piece.lineTo(pts[i].x+3,pts[i].y+4); piece.closePath(); piece.fillPath();
            // Base
            piece.lineStyle(2,0x111111,0.9); piece.fillStyle(blended,1); piece.beginPath(); piece.moveTo(pts[0].x,pts[0].y); for(let i=1;i<6;i++) piece.lineTo(pts[i].x,pts[i].y); piece.closePath(); piece.fillPath(); piece.strokePath();
            // Rim highlight
            piece.lineStyle(3,0xffffff,0.35); piece.beginPath(); piece.moveTo(pts[5].x,pts[5].y); piece.lineTo(pts[0].x,pts[0].y); piece.lineTo(pts[1].x,pts[1].y); piece.strokePath();
            // AO edge
            piece.lineStyle(3,0x000000,0.22); piece.beginPath(); piece.moveTo(pts[2].x,pts[2].y); piece.lineTo(pts[3].x,pts[3].y); piece.lineTo(pts[4].x,pts[4].y); piece.strokePath();
          }
        });
        // Pulse + glow
        this.scene.tweens.add({ targets: piece, scale: { from:1, to:1.16 }, yoyo:true, duration:170, ease:'Quad.Out' });
        const glow = this.scene.add.graphics();
        glow.x = piece.x; glow.y = piece.y; glow.setDepth(9);
        const rad = this.board.hexSize * 0.75;
        glow.fillStyle(toColor,0.4); glow.fillCircle(0,0,rad*0.2);
        this.scene.tweens.add({ targets: glow, scale: { from:1, to:2.2 }, alpha:{ from:0.6, to:0 }, duration:300, ease:'Quad.Out', onComplete:()=> glow.destroy() });
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
    // Allow only human to skip own turn and only if game hasn't ended
    if (this.players[this.currentPlayer].isAI || this.gameEnded) return;
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
    this.gameEnded = true;
    const winner = this.getWinner();
    this.ui.showGameOver(winner);
    this.ui.disableSkip(); // disable skip button when game ends
    this.ui.addBackToMenuButton(() => this.scene.scene.start('MenuScene')); // add menu button
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
