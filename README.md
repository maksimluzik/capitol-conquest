# Capitol Conquest - a Hexxagon Style Phaser Game

Modular two-player territory capture game on a hex grid built with Phaser 3.

## Architecture

`src/Board.js` – Generates and manages the axial hex grid.

`src/GameManager.js` – Core game rules, turn logic, move validation, piece placement and conversion, scoring, game-over detection.

`src/AI.js` – Simple move evaluation for a basic computer opponent.

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

Or with the provided `Makefile` (defaults to port 8000):

```
make serve          # start local server
make open           # open the game URL in browser
make push MSG="feat: something"  # add, commit, push
```

## Gameplay
When loading the page you'll be prompted to face another human or a basic computer opponent. Selecting the computer enables an AI to control the Democrats (player two).

Select one of your pieces (Republicans red / Democrats blue). When selected:

- Green rings mark adjacent (distance 1) hexes: clicking creates a duplicate there (original stays).
- Yellow rings mark jump (distance 2) hexes: clicking moves the piece (original removed).
- A selection ring (pale yellow) indicates the currently selected piece.
- You can click either the destination highlight ring itself or the underlying hex.
- After a move finishes, all adjacent enemy pieces (distance 1) convert to your color.

Turns alternate automatically; scores update after each move. The game ends when the board is full or neither player has a legal move—higher score wins (or draw on tie).

## Next Ideas
- Animated highlights & move previews
- Undo / redo stack
- AI opponent
- Responsive resizing
- Saving / loading game state
 - Particle capture effects & sound
 - Move history panel

## License
MIT (add a LICENSE file if distributing).
