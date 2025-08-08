// AIPlayer.js - heuristic AI for single-player mode
// Evaluates all possible moves and scores them using weighted factors:
//  - Immediate piece differential (after conversions)
//  - Opponent mobility reduction
//  - Central control (favor closer to board center)
//  - Risk (pieces adjacent to opponents)
//  - Random jitter to reduce predictability
// The AI simulates moves on an abstract representation without touching Phaser objects.

export class AIPlayer {
  constructor(playerId, options = {}) {
    this.id = playerId;
    this.weights = Object.assign({
      pieceDiff: 4.0,
      oppMobility: 2.5,
      centerControl: 1.2,
      risk: 1.5,
      jitter: 0.3
    }, options.weights);
  }

  decideMove(gameManager) {
    const board = gameManager.board;
    const myId = this.id;
    const oppId = (myId === 1) ? 2 : 1;

    const myPieces = [];
    const oppPieces = [];
    board.hexMap.forEach(hex => {
      const piece = hex.data.values.piece;
      if (!piece) return;
      const pid = piece.data.values.player;
      const entry = { q: piece.data.values.q, r: piece.data.values.r };
      if (pid === myId) myPieces.push(entry); else if (pid === oppId) oppPieces.push(entry);
    });
    if (!myPieces.length) return null;

    const allMoves = [];
    myPieces.forEach(p => this._collectMovesForPiece(p.q, p.r, board, allMoves));
    if (!allMoves.length) return null;

    const scored = allMoves.map(m => ({ move: m, score: this._scoreState(this._simulate(board, myPieces, oppPieces, m, myId, oppId), board, myId, oppId, m) }));
    scored.sort((a, b) => b.score - a.score);
    return scored[0].move;
  }

  _collectMovesForPiece(q, r, board, out) {
    for (let dq = -2; dq <= 2; dq++) {
      for (let dr = -2; dr <= 2; dr++) {
        if (dq === 0 && dr === 0) continue;
        const tq = q + dq, tr = r + dr;
        const hex = board.getHex(tq, tr);
        if (!hex || hex.data.values.piece) continue;
        const dist = this._axialDistance(q, r, tq, tr);
        if (dist > 2) continue;
        out.push({ fromQ: q, fromR: r, toQ: tq, toR: tr, type: dist === 1 ? 'duplicate' : 'jump' });
      }
    }
  }

  _simulate(board, myPieces, oppPieces, move, myId, oppId) {
    const my = myPieces.map(p => ({ ...p }));
    const opp = oppPieces.map(p => ({ ...p }));
    if (move.type === 'jump') {
      const idx = my.findIndex(p => p.q === move.fromQ && p.r === move.fromR);
      if (idx >= 0) my.splice(idx, 1);
    }
    my.push({ q: move.toQ, r: move.toR });
    this._adjacentDirs().forEach(([dq, dr]) => {
      const nq = move.toQ + dq, nr = move.toR + dr;
      const oidx = opp.findIndex(p => p.q === nq && p.r === nr);
      if (oidx >= 0) {
        const converted = opp.splice(oidx, 1)[0];
        my.push(converted);
      }
    });
    return { my, opp };
  }

  _scoreState(sim, board, myId, oppId, move) {
    const { my, opp } = sim;
    const pieceDiff = my.length - opp.length;
    const oppMoves = this._enumerateAllMoves(sim.opp, board).length;
    let distSum = 0;
    my.forEach(p => { distSum += this._axialDistance(p.q, p.r, 0, 0); });
    const avgDist = distSum / (my.length || 1);
    let riskAdj = 0;
    const oppSet = new Set(opp.map(p => `${p.q},${p.r}`));
    my.forEach(p => {
      this._adjacentDirs().forEach(([dq, dr]) => {
        if (oppSet.has(`${p.q + dq},${p.r + dr}`)) riskAdj++;
      });
    });
    const w = this.weights;
    return w.pieceDiff * pieceDiff + w.oppMobility * (-oppMoves) + w.centerControl * (-avgDist) + w.risk * (-riskAdj) + w.jitter * (Math.random() - 0.5);
  }

  _enumerateAllMoves(pieces, board) {
    const moves = [];
    pieces.forEach(p => this._collectMovesForPiece(p.q, p.r, board, moves));
    return moves;
  }

  _axialDistance(q1, r1, q2, r2) {
    const x1 = q1, z1 = r1, y1 = -x1 - z1;
    const x2 = q2, z2 = r2, y2 = -x2 - z2;
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2), Math.abs(z1 - z2));
  }

  _adjacentDirs() { return [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]]; }
}
