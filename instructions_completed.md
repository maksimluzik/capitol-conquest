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



---


Enhanced AI and UI Instructions:

Improved Game-Ending Logic:

Add robust game-over detection that triggers when either player has no pieces left on the board or no valid moves remaining.

When the game ends, display a clear message announcing the winner (player or AI) or a draw if applicable.

Disable further moves and highlight the final board state.

Refined AI Move Strategy:

Replace the current simple heuristic with a more nuanced decision-making process:

Evaluate all valid moves and simulate the outcome.

Score each move not just by immediate conversions but also by:

Maximizing the player’s total piece count after the move.

Minimizing risk of enabling opponent’s strong counter-moves (e.g., avoid moves that leave clusters vulnerable).

Prefer moves that strategically control board areas (e.g., center dominance or blocking opponent expansion).

Use a weighted scoring system combining these factors to select the best move.

Introduce a small random factor or move variability to avoid predictable AI behavior.

Ensure AI gracefully handles both duplication and jump moves.

Polished Game Mode Selection Menu:

Replace the current binary prompt with an interactive main menu scene featuring three options:

Singleplayer: Player vs AI.

Two-Player: Local multiplayer with two human players taking turns.

Help: Display concise game rules, controls, and objectives.

Highlight the selected menu option and allow navigation via keyboard or mouse.

Animate transitions between menu and game scenes smoothly.

Provide a clear way to return to the main menu from the game or help screen.

Modular Integration and Documentation:

Keep AI logic encapsulated in its own module/class, separated from UI and game state management.

Integrate game-over checks into the main game loop or turn manager.

Add comments explaining the AI scoring criteria and game-over triggers.

Ensure menu UI code is separated from core gameplay logic for maintainability.

Include hooks/events for switching between game modes and resetting game state.


---


Enhance the Phaser.js Hexxagon game with the following features:

Persistent Score Storage:

Store each player’s cumulative win count (for Republicans/red and Democrats/blue) in the browser’s localStorage.

Update the stored scores immediately after each completed game (win/loss/draw).

On game startup or when returning to the main menu, load and display the current cumulative scores prominently in the UI (e.g., in the menu or game HUD).

Provide a way to reset stored scores via a menu option or button.

Player Color Selection Before Single-Player:

Before starting a single-player game, present the player with a choice screen to select their side:

Choose Democrats (Blue)

Choose Republicans (Red)

The AI will automatically be assigned the opposite color.

The selection UI should be visually clear and interactive, allowing selection by mouse or keyboard.

After selection, proceed to start the single-player game with the chosen colors applied to the player and AI pieces accordingly.

Reflect the chosen color scheme in the game visuals and UI indicators (e.g., current turn color).

Integration Details:

Keep the new score storage and player selection UI modular and separated from core game logic.

Use Phaser scenes or UI overlays for the color selection and score display.

Add comments documenting how scores are saved and loaded, and how player color selection affects the game state.

Ensure that switching modes or restarting the game preserves or resets state appropriately.


---


Enhance the visual presentation of the Phaser.js Hexxagon game with these graphical improvements:

3D-Looking Hexagonal Pieces:

Replace existing circular tokens with hexagonal shapes matching the board hex tiles.

Use Phaser’s Graphics API or custom polygon shapes to draw the hex pieces.

Apply gradient fills and subtle shading to create a 3D effect, simulating light and shadow.

Add beveled edges or highlights on the hex pieces to enhance depth perception.

Ensure pieces are centered precisely on their hex cells without offset.

Smooth Animations for Moves and Conversion:

Animate piece duplication with a scaling effect: new piece scales up smoothly from zero to full size at the target hex.

Animate piece jumping as a smooth movement along a curved or straight path from source to destination hex.

Implement a color transition animation for conversion:

When a piece is converted, animate its fill color smoothly changing from the old color to the new color.

Consider adding a brief glow or pulse effect during conversion to highlight the change.

Use Phaser’s tweening system (scene.tweens) to create smooth and performant animations.

Enhanced Board Visuals:

Make the board background and hex tiles visually richer:

Add subtle gradients or texture fills to the hex tiles to make them look shinier and more polished.

Use highlights or soft shadows around hex edges to give a slight 3D relief effect.

Adjust the color palette for better contrast and vibrancy while keeping the red and blue theme consistent.

Optionally add ambient effects or subtle particle effects to enhance atmosphere without distracting.

General Visual polish:

Keep all graphical elements resolution-independent and sharp on different screen sizes.

Ensure animations do not interfere with gameplay clarity or responsiveness.

Comment the graphics code clearly, explaining shading techniques and animation logic.