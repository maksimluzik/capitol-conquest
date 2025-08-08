export function performAIMove(gameManager) {
  const moves = [];
  const board = gameManager.board;
  board.forEachHex(hex => {
    const piece = hex.data.values.piece;
    if (piece && piece.data.values.player === gameManager.currentPlayer) {
      const { q, r } = piece.data.values;
      getValidMovesForPiece(board, q, r).forEach(m => moves.push({ ...m, piece }));
    }
  });
  if (moves.length === 0) { gameManager.endTurn(); return; }
  let best = moves[0];
  let bestScore = potentialGain(board, best.q, best.r, gameManager.currentPlayer);
  moves.forEach(m => {
    const score = potentialGain(board, m.q, m.r, gameManager.currentPlayer);
    if (score > bestScore) { best = m; bestScore = score; }
  });
  gameManager.selectedPiece = best.piece;
  gameManager.executeMove(best);
}

function getValidMovesForPiece(board, q, r) {
  const moves = [];
  for (let dq = -2; dq <= 2; dq++) {
    for (let dr = -2; dr <= 2; dr++) {
      const nq = q + dq;
      const nr = r + dr;
      if (dq === 0 && dr === 0) continue;
      const dist = axialDistance(q, r, nq, nr);
      if (dist > 2) continue;
      const hex = board.getHex(nq, nr);
      if (!hex || hex.data.values.piece) continue;
      const type = (dist === 1) ? 'duplicate' : (dist === 2 ? 'jump' : null);
      if (type) moves.push({ q: nq, r: nr, type });
    }
  }
  return moves;
}

function potentialGain(board, q, r, player) {
  let gain = 0;
  directionsDuplicate().forEach(([dq, dr]) => {
    const hex = board.getHex(q + dq, r + dr);
    if (hex && hex.data.values.piece && hex.data.values.piece.data.values.player !== player) {
      gain++;
    }
  });
  return gain;
}

function directionsDuplicate() {
  return [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
}

function axialDistance(q1, r1, q2, r2) {
  const x1 = q1, z1 = r1, y1 = -x1 - z1;
  const x2 = q2, z2 = r2, y2 = -x2 - z2;
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2), Math.abs(z1 - z2));
}
