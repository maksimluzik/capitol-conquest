// MenuScene.js - main menu and help scenes
import { GameScene } from './GameScene.js';
import { loadScores, resetScores } from './PersistentScores.js';
import { Config } from './config.js';

export class MenuScene extends Phaser.Scene {
  constructor(){ super('MenuScene'); }
  
  preload() {
    // Load the background image
    this.load.image('splash', Config.ASSETS.SPLASH_IMAGE);
    // Load background music
    this.load.audio('backgroundMusic', Config.ASSETS.BACKGROUND_MUSIC);
  }
  
  create(){
    const w = this.scale.width; const h = this.scale.height;
    
    // Add background image
    const bg = this.add.image(w/2, h/2, 'splash');
    // Scale to fit screen while maintaining aspect ratio
    const scaleX = w / bg.width;
    const scaleY = h / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);
    
    // Add semi-transparent overlay for better text readability
    this.add.rectangle(w/2, h/2, w, h, Config.COLORS.OVERLAY_DARK, 0.3);
    
    // Initialize background music
    this.initializeMusic();
    
    // Get responsive layout
    const layout = Config.DEVICE.getMobileLayout(this);
    
    // Create stylish title with enhanced visual effects
    this.createStylishTitle(w, h, layout);
    
    // Add resize listener for mobile viewport changes
    this.scale.on('resize', this.handleResize, this);
    
      const options = [
        { label:'Single Player (vs AI)', mode:'single' },
        { label:'Two Player Local', mode:'two' },
        { label:'Online Multiplayer', mode:'online' },
        { label:'Global Statistics', mode:'stats' },
        { label:'Help & Rules', mode:'help' },
        { label:'Reset Local Scores', mode:'reset' }
      ];
    this.items = [];
    options.forEach((o,i)=>{
      const fontSize = layout.isMobile ? Config.FONT_SIZES.SMALL : Config.FONT_SIZES.MEDIUM;
      const spacing = layout.buttonSpacing;
      const padding = { x: layout.padding, y: layout.padding / 2 };
      
      const t = this.add.text(w/2, h/2 + i*spacing - 20, o.label, 
        Config.textStyle(fontSize, Config.COLORS.TEXT_WHITE, {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          padding: padding,
          borderRadius: 8
        })
      ).setOrigin(0.5).setInteractive({ useHandCursor:true });
      
      t.on('pointerover', ()=> t.setStyle({ 
        color: Config.COLORS.TEXT_GOLD,
        backgroundColor: 'rgba(0, 0, 0, 0.8)'
      })); 
      t.on('pointerout', ()=> t.setStyle({ 
        color: Config.COLORS.TEXT_WHITE,
        backgroundColor: 'rgba(0, 0, 0, 0.6)'
      })); 
      t.on('pointerdown', ()=> this._select(o));
      this.items.push(t);
    });
    this.sel = -1; // No default selection
    // Don't call this._hilite() initially so no item is pre-selected
    this.input.keyboard.on('keydown-UP', ()=> this._move(-1));
    this.input.keyboard.on('keydown-DOWN', ()=> this._move(1));
    this.input.keyboard.on('keydown-ENTER', ()=> this._activate());
  this._renderScores();
  }
  _move(d){ 
    if (this.sel === -1) {
      // If nothing selected, start from first or last item
      this.sel = d > 0 ? 0 : this.items.length - 1;
    } else {
      this.sel = (this.sel + d + this.items.length) % this.items.length;
    }
    this._hilite(); 
  }
  _hilite(){ 
    this.items.forEach((it,i)=> {
      if (i === this.sel) {
        it.setStyle({ 
          fontStyle: 'bold',
          backgroundColor: 'rgba(255, 215, 0, 0.2)',
          color: Config.COLORS.TEXT_GOLD
        });
      } else {
        it.setStyle({ 
          fontStyle: 'normal',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          color: Config.COLORS.TEXT_WHITE
        });
      }
    }); 
  }
  _activate(){ 
    if (this.sel === -1) return; // Do nothing if no item selected
      const map = ['single','two','online','stats','help','reset'];
    this._select({ mode: map[this.sel] }); 
  }
  _select(o){
    if (o.mode==='help'){ this.scene.start('HelpScene'); return; }
    if (o.mode==='stats'){ this.scene.start('GlobalStatsScene'); return; }
    if (o.mode==='reset'){ resetScores(); this._renderScores(); return; }
    if (o.mode==='single'){ this.scene.start('ColorSelectScene'); return; }
    this.scene.start('GameScene',{ mode:o.mode });
  }
  _renderScores(){
    const scores = loadScores();
    if (this.scoreText) this.scoreText.destroy();
    this.scoreText = this.add.text(this.scale.width/2, this.scale.height - 40,
      `Local Wins  Red: ${scores.red}  Blue: ${scores.blue}`,
      Config.textStyle(Config.FONT_SIZES.SMALL, Config.COLORS.TEXT_LIGHT_BLUE)).setOrigin(0.5).setDepth(50);
  }

  createStylishTitle(w, h, layout) {
    const titleY = h/2 - (layout.isMobile ? 100 : 140);
    const titleSize = layout.isMobile ? '36px' : '58px';
    const glowSize = layout.isMobile ? '40px' : '62px';
    
    // Create shadow layer (multiple shadows for depth)
    this.add.text(w/2 + (layout.isMobile ? 2 : 4), titleY + (layout.isMobile ? 3 : 6), 'Capitol Conquest', 
      Config.textStyle(titleSize, '#000000', { 
        fontWeight: 'bold',
        fontFamily: 'serif'
      })
    ).setOrigin(0.5).setDepth(10).setAlpha(0.3);
    
    this.add.text(w/2 + (layout.isMobile ? 1 : 2), titleY + (layout.isMobile ? 1.5 : 3), 'Capitol Conquest', 
      Config.textStyle(titleSize, '#000000', { 
        fontWeight: 'bold',
        fontFamily: 'serif'
      })
    ).setOrigin(0.5).setDepth(11).setAlpha(0.5);
    
    // Create main title with gradient-like effect using stroke
    const mainTitle = this.add.text(w/2, titleY, 'Capitol Conquest', 
      Config.textStyle(titleSize, Config.COLORS.TEXT_BRIGHT_GOLD, {
        fontWeight: 'bold',
        fontFamily: 'serif',
        stroke: '#8B4513',
        strokeThickness: layout.isMobile ? 2 : 3
      })
    ).setOrigin(0.5).setDepth(12);
    
    // Add highlight effect
    this.add.text(w/2, titleY - (layout.isMobile ? 0.5 : 1), 'Capitol Conquest', 
      Config.textStyle(titleSize, '#FFFFFF', {
        fontWeight: 'bold',
        fontFamily: 'serif',
        stroke: '#FFD700',
        strokeThickness: 1
      })
    ).setOrigin(0.5).setDepth(13).setAlpha(0.6);
    
    // Add subtle glow effect with animated pulse
    const glowTitle = this.add.text(w/2, titleY, 'Capitol Conquest', 
      Config.textStyle(glowSize, Config.COLORS.TEXT_BRIGHT_GOLD, {
        fontWeight: 'bold',
        fontFamily: 'serif'
      })
    ).setOrigin(0.5).setDepth(9).setAlpha(0.2);
    
    // Animate the glow for a subtle pulsing effect
    this.tweens.add({
      targets: glowTitle,
      alpha: { from: 0.1, to: 0.3 },
      scale: { from: 1.0, to: 1.05 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });
  }

  // Music control methods
  initializeMusic() {
    // Get or create global music state
    if (!this.game.music) {
      this.game.music = {
        background: null,
        isPlaying: localStorage.getItem('musicEnabled') !== 'false', // Default to enabled
        volume: parseFloat(localStorage.getItem('musicVolume')) || 0.3
      };
    }
    
    // Create music if not already created
    if (!this.game.music.background && this.sound) {
      this.game.music.background = this.sound.add('backgroundMusic', {
        loop: true,
        volume: this.game.music.volume
      });
    }
    
    // Start playing if enabled and not already playing
    if (this.game.music.isPlaying && this.game.music.background && !this.game.music.background.isPlaying) {
      this.game.music.background.play();
    }
    
    // Add music control button
    this.addMusicToggle();
  }
  
  addMusicToggle() {
    const w = this.scale.width;
    const musicIcon = this.game.music.isPlaying ? '🎵' : '🔇';
    
    this.musicToggle = this.add.text(w - 20, 20, musicIcon, 
      Config.textStyle(Config.FONT_SIZES.MEDIUM, Config.COLORS.TEXT_WHITE)
    ).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(200);
    
    this.musicToggle.on('pointerdown', () => this.toggleMusic());
    this.musicToggle.on('pointerover', () => this.musicToggle.setScale(1.2));
    this.musicToggle.on('pointerout', () => this.musicToggle.setScale(1.0));
  }
  
  toggleMusic() {
    if (!this.game.music.background) return;
    
    this.game.music.isPlaying = !this.game.music.isPlaying;
    
    if (this.game.music.isPlaying) {
      this.game.music.background.play();
      this.musicToggle.setText('🎵');
    } else {
      this.game.music.background.pause();
      this.musicToggle.setText('🔇');
    }
    
    // Save preference
    localStorage.setItem('musicEnabled', this.game.music.isPlaying.toString());
  }
  
  handleResize(gameSize, baseSize, displaySize, resolution) {
    // Only recreate scene for mobile devices on significant size changes
    const layout = Config.DEVICE.getMobileLayout(this);
    if (layout.isMobile) {
      // Clear existing scene and recreate with new dimensions
      this.scene.restart();
    }
  }
}

export class HelpScene extends Phaser.Scene {
  constructor(){ super('HelpScene'); }
  
  preload() {
    this.load.image('splash', Config.ASSETS.SPLASH_IMAGE);
  }
  
  create(){
    const w = this.scale.width; const h = this.scale.height;
    const layout = Config.DEVICE.getMobileLayout(this);
    
    // Add background image
    const bg = this.add.image(w/2, h/2, 'splash');
    const scaleX = w / bg.width;
    const scaleY = h / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);
    
    // Add semi-transparent overlay
    this.add.rectangle(w/2, h/2, w, h, Config.COLORS.OVERLAY_DARK, 0.8);
    
    // Title
    const titleY = layout.isMobile ? 30 : 40;
    const titleSize = layout.isMobile ? Config.FONT_SIZES.MEDIUM : Config.FONT_SIZES.LARGE;
    this.add.text(w/2, titleY, '🏛️ How to Play Capitol Conquest', 
      Config.textStyle(titleSize, Config.COLORS.TEXT_BRIGHT_GOLD)
    ).setOrigin(0.5);
    
    // Game rules with emojis
    const rulesText = `🎯 OBJECTIVE:
Conquer the political battlefield! Control more territories than your opponent when no more moves are possible.

🔴 RED (Republicans) vs 🔵 BLUE (Democrats)

🎮 HOW TO PLAY:
1️⃣ Click on your piece to select it
2️⃣ Choose your move strategy:

🟢 DUPLICATE (Distance 1):
• Move to adjacent hexagon
• Original piece stays in place
• Both positions now belong to you

🟡 JUMP (Distance 2):
• Move to hexagon 2 spaces away
• Original piece disappears
• Only destination belongs to you

⚡ CONVERSION POWER:
After each move, all enemy pieces adjacent to your new piece automatically convert to your color!

🎲 TURN SYSTEM:
• Take turns moving pieces
• Skip turn if you can't move
• Game ends when neither player can move

🏆 WINNING:
Player with the most pieces on the board wins!

⌨️ CONTROLS:
• ESC - Return to menu
• F - Forfeit game (local games only)
• S - Skip turn (local games only)
• ENTER - Send chat message (online games)

💬 ONLINE MULTIPLAYER:
• Real-time chat with your opponent
• Turn-based gameplay with visual indicators
• Automatic matchmaking with other players

💡 STRATEGY TIPS:
• Use duplicates to expand territory safely
• Use jumps to reach strategic positions
• Think about conversions before moving
• Control the center for maximum influence`;

    // Scrolling setup without mask
    this.scrollY = 0;
    this.maxScrollY = 0;
    
    // Create the rules text with mobile-responsive sizing
    const textX = layout.isMobile ? 20 : 50;
    const textY = layout.isMobile ? 80 : 120;
    const textWidth = layout.isMobile ? w - 40 : w - 100;
    const fontSize = layout.isMobile ? 12 : Config.FONT_SIZES.TINY;
    
    this.rulesTextObj = this.add.text(textX, textY, rulesText, 
      Config.textStyle(fontSize, Config.COLORS.TEXT_WHITE, { 
        wordWrap: { width: textWidth },
        lineSpacing: layout.isMobile ? 3 : 5
      })
    );
    
    // Calculate max scroll based on content that goes below visible area
    const visibleAreaBottom = h - (layout.isMobile ? 30 : 50); // Leave some space at bottom
    const textBottom = this.rulesTextObj.y + this.rulesTextObj.height;
    this.maxScrollY = Math.max(0, textBottom - visibleAreaBottom);
    
    // Simple scroll with mouse wheel - just move the text up/down
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      this.scrollY += deltaY * 0.5;
      this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScrollY);
      this.rulesTextObj.y = textY - this.scrollY;
    });
    
    // Back button (similar to GlobalStatsScene) with mobile positioning
    const backBtnX = layout.isMobile ? 30 : 40;
    const backBtnY = layout.isMobile ? 30 : 40;
    const backBtnSize = layout.isMobile ? 14 : Config.FONT_SIZES.SMALL;
    const backBtn = this.add.text(backBtnX, backBtnY, '← Back', 
      Config.textStyle(backBtnSize, Config.COLORS.TEXT_CYAN)
    ).setInteractive({ useHandCursor: true });
    
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    backBtn.on('pointerover', () => backBtn.setStyle({ color: Config.COLORS.TEXT_BRIGHT_GOLD }));
    backBtn.on('pointerout', () => backBtn.setStyle({ color: Config.COLORS.TEXT_CYAN }));
    
    // ESC key support
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));
  }
}

export class ColorSelectScene extends Phaser.Scene {
  constructor(){ super('ColorSelectScene'); }
  
  preload() {
    this.load.image('splash', Config.ASSETS.SPLASH_IMAGE);
  }
  
  create(){
    const w = this.scale.width; const h = this.scale.height;
    const layout = Config.DEVICE.getMobileLayout(this);
    
    // Add background image
    const bg = this.add.image(w/2, h/2, 'splash');
    const scaleX = w / bg.width;
    const scaleY = h / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);
    
    // Add semi-transparent overlay
    this.add.rectangle(w/2, h/2, w, h, Config.COLORS.OVERLAY_DARK, 0.3);
    
    const titleOffset = layout.isMobile ? -120 : -160;
    const titleSize = layout.isMobile ? Config.FONT_SIZES.MEDIUM : Config.FONT_SIZES.LARGE;
    this.add.text(w/2, h/2 + titleOffset, 'Choose Your Side', Config.textStyle(titleSize, Config.COLORS.TEXT_WHITE)).setOrigin(0.5);
    
    // Color options
    const colorOptions = [
      { label:'Play as Red (Republicans)', playerId:1, playerColor:0xd94343, aiColor:0x3a52d9 },
      { label:'Play as Blue (Democrats)', playerId:2, playerColor:0x3a52d9, aiColor:0xd94343 }
    ];
    
    colorOptions.forEach((o,i)=>{
      const fontSize = layout.isMobile ? Config.FONT_SIZES.SMALL : Config.FONT_SIZES.MEDIUM;
      const spacing = layout.isMobile ? 45 : 60;
      const yOffset = layout.isMobile ? -60 : -80;
      
      const t = this.add.text(w/2, h/2 + i*spacing + yOffset, o.label, 
        Config.textStyle(fontSize, Config.COLORS.TEXT_WHITE, {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          padding: { x: layout.padding, y: layout.padding / 2 },
          borderRadius: 8
        })
      ).setOrigin(0.5).setInteractive({ useHandCursor:true });
      
      t.on('pointerover', ()=> t.setStyle({ 
        color: Config.COLORS.TEXT_GOLD,
        backgroundColor: 'rgba(0, 0, 0, 0.8)'
      }));
      t.on('pointerout', ()=> t.setStyle({ 
        color: Config.COLORS.TEXT_WHITE,
        backgroundColor: 'rgba(0, 0, 0, 0.6)'
      }));
      t.on('pointerdown', ()=> this._selectColor(o));
    });
    
    // Difficulty selection
    const difficultyTitleY = layout.isMobile ? h/2 + 30 : h/2 + 50;
    const difficultyTitleSize = layout.isMobile ? Config.FONT_SIZES.SMALL : Config.FONT_SIZES.MEDIUM;
    this.add.text(w/2, difficultyTitleY, 'Choose Difficulty Level', 
      Config.textStyle(difficultyTitleSize, Config.COLORS.TEXT_WHITE)
    ).setOrigin(0.5);
    
    const difficultyOptions = [
      { label:`Normal (Equal Start)`, ...Config.DIFFICULTY.LEVELS.NORMAL },
      { label:`Hard (AI starts with ${Config.DIFFICULTY.LEVELS.HARD.aiPieceMultiplier}x pieces)`, ...Config.DIFFICULTY.LEVELS.HARD },
      { label:`Expert (AI starts with ${Config.DIFFICULTY.LEVELS.EXPERT.aiPieceMultiplier}x pieces)`, ...Config.DIFFICULTY.LEVELS.EXPERT }
    ];
    
    // Store difficulty text objects for updating checkboxes
    this.difficultyTexts = [];
    
    difficultyOptions.forEach((o,i)=>{
      // Preselect normal difficulty (index 0)
      const isPreselected = o.difficulty === Config.DIFFICULTY.DEFAULT.difficulty;
      const checkboxText = (isPreselected ? '☑️ ' : '☐ ') + o.label;
      const textColor = isPreselected ? Config.COLORS.TEXT_GOLD : Config.COLORS.TEXT_WHITE;
      
      const difficultySpacing = layout.isMobile ? 35 : 50;
      const difficultyStartY = layout.isMobile ? 60 : 80;
      const difficultyFontSize = layout.isMobile ? 14 : Config.FONT_SIZES.SMALL;
      
      const t = this.add.text(w/2, h/2 + i*difficultySpacing + difficultyStartY, checkboxText, 
        Config.textStyle(difficultyFontSize, textColor)
      ).setOrigin(0.5).setInteractive({ useHandCursor:true });
      
      t.on('pointerover', ()=> t.setStyle({ color: Config.COLORS.TEXT_GOLD }));
      t.on('pointerout', ()=> {
        // Maintain golden color for selected item, white for others
        const currentColor = this.selectedDifficulty === o ? Config.COLORS.TEXT_GOLD : Config.COLORS.TEXT_WHITE;
        t.setStyle({ color: currentColor });
      });
      t.on('pointerdown', ()=> this._selectDifficulty(o, i));
      
      // Store reference for updating
      t.difficultyOption = o;
      this.difficultyTexts.push(t);
    });
    
    // Storage for selections - preselect normal difficulty
    this.selectedColor = null;
    this.selectedDifficulty = Config.DIFFICULTY.DEFAULT; // Normal difficulty preselected
    
    this.input.keyboard.on('keydown-ESC', ()=> this.scene.start('MenuScene'));
  }
  _selectColor(colorOption) {
    this.selectedColor = colorOption;
    if (this.selectedDifficulty) {
      this._startGame();
    }
  }
  
  _selectDifficulty(difficultyOption, index) {
    this.selectedDifficulty = difficultyOption;
    
    // Update all difficulty checkboxes
    this.difficultyTexts.forEach((textObj, i) => {
      const isSelected = i === index;
      const checkbox = isSelected ? '☑️ ' : '☐ ';
      const newText = checkbox + textObj.difficultyOption.label;
      textObj.setText(newText);
      
      // Update color for selected item
      if (isSelected) {
        textObj.setStyle({ color: Config.COLORS.TEXT_GOLD });
      } else {
        textObj.setStyle({ color: Config.COLORS.TEXT_WHITE });
      }
    });
    
    if (this.selectedColor) {
      this._startGame();
    }
  }
  
  _startGame() {
    if (!this.selectedColor || !this.selectedDifficulty) return;
    
    // Pass both color choice and difficulty to GameScene
    this.scene.start('GameScene', { 
      mode:'single', 
      playerChoice: this.selectedColor,
      difficulty: this.selectedDifficulty
    });
  }
  _choose(o){
    // Pass custom player colors to GameScene
    this.scene.start('GameScene', { mode:'single', playerChoice:o });
  }
}

// Ensure GameScene is registered by import side-effect when using scene array.
