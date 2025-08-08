# Capitol Conquest - a Hexxagon Style Phaser Game

Modular two-player territory capture game on a hex grid built with Phaser 3.

## Architecture

`src/Board.js` – Generates and manages the axial hex grid.

`src/GameManager.js` – Core game rules, turn logic, move validation, piece placement and conversion, scoring, game-over detection.

`src/UIManager.js` – Score + turn text and game-over overlay.

`src/GameScene.js` – Wires subsystems inside a Phaser Scene.

`src/index.js` – Phaser game configuration & bootstrap entry (ES module).

## Visual Enhancements
Tokens are rendered with layered gradient-like circles, subtle shadow, and highlight arc for a beveled/3D feel. Hex tiles include an inner highlight ring for light depth. All drawing uses Phaser Graphics for resolution-independent scaling.

## Run
Serve the folder and open `index.html` (ES modules require a server, not a file:// load in some browsers).

Example using Python 3:

```
python3 -m http.server 8000
```

Visit: http://localhost:8000

## Gameplay
Select one of your pieces (Republicans red / Democrats blue). Valid duplicate (adjacent) and jump (further) destinations are computed (visual highlight placeholders ready—enhance further as needed). Move duplicates or jumps; adjacent opponent pieces convert. Board / move exhaustion ends the game; higher piece count wins.

## Next Ideas
- Animated highlights & move previews
- Undo / redo stack
- AI opponent
- Responsive resizing
- Saving / loading game state

## License
MIT (add a LICENSE file if distributing).
