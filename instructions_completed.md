Create a complete Phaser.js game inspired by the classic Hexxagon game. The gameplay should feature a hexagonal grid board where two players compete by spreading their colored pieces: red for Republicans and blue for Democrats. The objective is to dominate the board by converting opponent’s tiles.

Requirements:

Use Phaser 3 framework.

The board should be a hexagonal grid (about 7x7 or 8x8 hexes).

Two players: Republicans (red pieces) and Democrats (blue pieces).

Each player can either duplicate their piece to an adjacent hex or jump to a hex two spaces away.

After a move, any opponent pieces adjacent to the destination hex are converted to the moving player’s color.

Visual representation:

Hex tiles distinct and visible with clear borders.

Red and blue circular tokens representing player pieces.

Highlight valid moves when a piece is selected.

Turn-based gameplay with simple UI showing current player and scores.

Implement basic game-over detection when no moves are available or board is full.

Provide simple mouse/touch input to select and move pieces.

Keep code modular and well-commented for clarity.

Deliver the code as a single self-contained Phaser.js project file or snippet that can run in an HTML environment.


---

Structure the Phaser.js game code into clear, modular components following best practices for Phaser 3 development:

Separate core game logic, board/grid management, player input handling, and UI updates into distinct classes or modules.

Use ES6 classes or JavaScript modules for each responsibility (e.g., Board, Player, GameManager, UI).

Keep scene setup and asset loading in a main scene or bootloader module.

Encapsulate hex grid logic and rendering in a dedicated HexGrid or Board module.

Handle player turns, move validation, and game state in a GameManager or controller module.

Keep UI elements (score display, turn indicator) in a UI module or scene overlay.

Use event-driven or callback mechanisms to communicate between modules cleanly.

Improve the visual style of the game by replacing simple colored circles with enhanced SVG or Phaser graphics:

Use hexagonal tokens with slight 3D shading or gradient fills to create depth perception.

Add beveled edges or subtle shadows on tokens to make them appear raised.

Position tokens precisely centered on hex tiles to avoid offset artifacts.

Consider using Phaser's Graphics API to draw polygons with gradients for tokens and hexes.

Alternatively, embed optimized SVG images or sprite sheets with visually richer pieces.

Ensure tokens scale nicely with the board size and maintain consistent spacing.