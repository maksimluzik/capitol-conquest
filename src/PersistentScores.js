// PersistentScores.js
// Handles loading, saving, and resetting cumulative win counts in localStorage.
// Stored format: { red: number, blue: number }

export const SCORE_KEY = 'cc_scores_v1';

export function loadScores() {
  try {
    const raw = localStorage.getItem(SCORE_KEY);
    if (!raw) return { red: 0, blue: 0 };
    const parsed = JSON.parse(raw);
    return { red: parsed.red || 0, blue: parsed.blue || 0 };
  } catch (e) {
    return { red: 0, blue: 0 };
  }
}

export function saveScores(scores) {
  try { localStorage.setItem(SCORE_KEY, JSON.stringify(scores)); } catch (e) { /* ignore */ }
}

export function resetScores() { saveScores({ red: 0, blue: 0 }); }

export function addWinByColor(color) {
  // Color constants assumed: red 0xd94343, blue 0x3a52d9
  const scores = loadScores();
  if (color === 0xd94343) scores.red += 1; else if (color === 0x3a52d9) scores.blue += 1; else return;
  saveScores(scores);
}
