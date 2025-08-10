# Capitol Conquest - a Hexxagon Style Phaser Game 🏛️

A strategic hex-based board game where Republicans and Democrats battle for control of the Capitol! Built with Phaser 3 and featuring AI opponents with multiple difficulty levels.

## 🎮 Game Features

### **Core Gameplay**
- **Hex-based Strategy**: Strategic gameplay on a hexagonal board
- **Two Move Types**: 
  - 🟢 **Duplicate** (Distance 1): Copy your piece to an adjacent hex
  - 🟡 **Jump** (Distance 2): Move your piece up to 2 hexes away
- **Conversion Mechanic**: Adjacent enemy pieces automatically flip to your side
- **Victory Condition**: Control the most pieces when the board is full

### **Game Modes**
- **Single Player vs AI**: Challenge the computer with multiple difficulty levels
- **Two Player Local**: Play against a friend on the same device
- **AI Difficulty Levels**:
  - 🟢 **Normal**: Equal starting pieces (3 vs 3)
  - 🟡 **Hard**: AI starts with 3x pieces (3 vs 9) 
  - 🔴 **Expert**: AI starts with 5x pieces (3 vs 15)

### **Audio System**
- 🎵 **Background Music**: Atmospheric soundtrack with toggle controls
- 🔊 **Sound Effects**: 
  - Piece movement sounds (duplicate vs jump)
  - Conversion sound when flipping enemy pieces
  - Music toggle available in all scenes

### **Mobile & Desktop Support**
- 📱 **Fully Responsive**: Optimized for both mobile and desktop
- 🔄 **Dynamic Viewport**: Adapts to mobile browser bars and orientation changes
- ⚡ **Touch-Friendly**: Proper touch targets and mobile-optimized UI
- 🖥️ **Desktop Enhanced**: Larger board and enhanced visuals on desktop

## 🤖 AI Implementation

### **Algorithm: Greedy Heuristic with Multi-Factor Evaluation**

The AI uses a sophisticated single-depth evaluation system rather than traditional minimax:

```javascript
// Multi-factor scoring system
const score = 
  w.pieceDiff * pieceDiff +           // Material advantage (4.0)
  w.oppMobility * (-oppMoves) +       // Limit opponent options (2.5)
  w.centerControl * (-avgDist) +      // Control board center (1.2)
  w.risk * (-riskAdj) +               // Avoid risky positions (1.5)
  w.jitter * (Math.random() - 0.5);   // Unpredictability (0.3)
```

### **AI Features**
- **Move Simulation**: Tests all possible moves without affecting game state
- **Tactical Awareness**: Evaluates piece conversions and positional advantage
- **Strategic Positioning**: Favors central control and limits opponent mobility
- **Adaptive Difficulty**: Different AI weights and starting advantages
- **Unpredictable Play**: Jitter factor prevents repetitive patterns

## 📊 Statistics & Analytics

### **Global Statistics System**
- **Google Sheets Integration**: Real-time game statistics tracking
- **Win Rate Analysis**: Track performance by game mode and difficulty
- **Recent Games**: View last 10 games with detailed information
- **Player Performance**: Statistics for both human vs AI and multiplayer games

### **Data Tracking**
- Game outcomes and duration
- Difficulty levels and AI multipliers
- Player color choices
- Timestamps and game modes

### **Analytics Integration**
- **Google Tag Manager**: Comprehensive user behavior tracking
- **Subdomain Support**: Analytics for cc.maksimluzik.com
- **Performance Metrics**: Page views, session data, and user engagement

## 🎨 User Interface

### **Stylish Design**
- **Branded Title**: Multi-layered "Capitol Conquest" with shadows and gold styling
- **Responsive Menus**: Touch-friendly buttons with hover effects
- **Visual Feedback**: Clear indication of selected options and game state
- **Themed Colors**: Republican red and Democrat blue throughout

### **Enhanced UX**
- **Keyboard Navigation**: Full arrow key and Enter support
- **Visual Indicators**: Checkboxes for difficulty selection
- **Smart Defaults**: Normal difficulty pre-selected
- **Error Handling**: Graceful fallbacks for offline play

### **Mobile Optimizations**
- **Dynamic Scaling**: UI adapts to screen size and orientation
- **Touch Targets**: Appropriately sized buttons and interactive elements
- **Viewport Handling**: Supports dynamic viewport changes (browser bars)
- **Responsive Typography**: Text scaling based on device type

## 🛠️ Technical Architecture

### **Frontend Framework**
- **Phaser 3**: Modern HTML5 game framework
- **ES6 Modules**: Clean, modular JavaScript architecture
- **Responsive Design**: CSS Grid and Flexbox for layout
- **Progressive Enhancement**: Works offline with cached data

### **Backend Integration**
- **Google Apps Script**: Serverless backend for data recording
- **Google Sheets API**: Real-time statistics reading
- **Form-based POST**: Reliable data submission without preflight issues

### **Mobile Support**
- **Phaser Scale Manager**: Dynamic viewport handling
- **Device Detection**: Native Phaser device identification
- **Responsive Breakpoints**: Mobile/tablet/desktop optimizations
- **Touch Events**: Full touch gesture support

## 🚀 Deployment

### **GitHub Pages Ready**
- **Static Site**: No build process required
- **CDN Assets**: Phaser and external libraries via CDN
- **Custom Domain**: Configured for cc.maksimluzik.com
- **GitHub Actions**: Automated deployment workflow

### **Performance Optimizations**
- **Lazy Loading**: Assets loaded on demand
- **Caching Strategy**: LocalStorage for offline functionality
- **Efficient Rendering**: Optimized Phaser rendering pipeline
- **Mobile Performance**: Reduced complexity for mobile devices

## 📁 Project Structure

```
src/
├── AI.js                  # AI implementation with heuristic evaluation
├── Board.js               # Hex board generation and management
├── GameManager.js         # Core game logic and state management
├── GameScene.js           # Main gameplay scene
├── GlobalStats.js         # Statistics tracking and Google Sheets integration
├── GlobalStatsScene.js    # Statistics display scene
├── MenuScene.js           # Menu system (Main, Color Select, Help)
├── UIManager.js           # UI elements and responsive layout
└── config.js              # Game configuration and constants

assets/
├── backgrounds/           # Background images
└── sounds/               # Music and sound effects

manuals/
└── apps_script.js        # Google Apps Script backend code
```

## 🎯 Game Rules

### **Objective**
Control the most pieces when all playable hexes are filled.

### **Gameplay**
1. **Choose Your Side**: Play as 🔴 Republicans or 🔵 Democrats
2. **Select Difficulty**: Normal, Hard, or Expert (single player)
3. **Make Moves**: 
   - **Duplicate** to adjacent hex (distance 1)
   - **Jump** to nearby hex (distance 2)
4. **Convert Enemies**: Adjacent opponent pieces automatically flip
5. **Win Condition**: Have the most pieces when the board is full

### **Controls**
- **Mouse/Touch**: Click to select and move pieces
- **Keyboard**: Arrow keys for menu navigation, Enter to select
- **ESC**: Return to menu from any scene
- **F**: Toggle fullscreen mode
- **Music Toggle**: 🎵/🔇 icon in top-right corner

## 🎵 Audio Credits

### **Sound Effects**
Sound effects are sourced from [Freesound.org](https://freesound.org/) - a collaborative database of Creative Commons licensed sounds.

### **Background Music**
Background music is AI-generated using [AIVA (Artificial Intelligence Virtual Artist)](https://creators.aiva.ai/) - an AI composer that creates original musical compositions.

## 🌐 Live Demo

Visit **[cc.maksimluzik.com](https://cc.maksimluzik.com)** to play Capitol Conquest!

## 📄 License

This project is open source and available under the MIT License.

---

**Capitol Conquest** - Where strategy meets the Capitol! 🏛️⚡
