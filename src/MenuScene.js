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
    
    // Create stylish title with enhanced visual effects
    this.createStylishTitle(w, h);
    
    const options = [
      { label:'Single Player (vs AI)', mode:'single' },
      { label:'Two Player Local', mode:'two' },
      { label:'Global Statistics', mode:'stats' },
      { label:'Help & Rules', mode:'help' },
      { label:'Reset Local Scores', mode:'reset' }
    ];
    this.items = [];
    options.forEach((o,i)=>{
      const t = this.add.text(w/2, h/2 + i*60 - 20, o.label, 
        Config.textStyle(Config.FONT_SIZES.MEDIUM, Config.COLORS.TEXT_WHITE, {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          padding: { x: 16, y: 8 },
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
    const map = ['single','two','stats','help','reset']; 
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

  createStylishTitle(w, h) {
    const titleY = h/2 - 140;
    
    // Create shadow layer (multiple shadows for depth)
    this.add.text(w/2 + 4, titleY + 6, 'Capitol Conquest', 
      Config.textStyle('58px', '#000000', { 
        fontWeight: 'bold',
        fontFamily: 'serif'
      })
    ).setOrigin(0.5).setDepth(10).setAlpha(0.3);
    
    this.add.text(w/2 + 2, titleY + 3, 'Capitol Conquest', 
      Config.textStyle('58px', '#000000', { 
        fontWeight: 'bold',
        fontFamily: 'serif'
      })
    ).setOrigin(0.5).setDepth(11).setAlpha(0.5);
    
    // Create main title with gradient-like effect using stroke
    const mainTitle = this.add.text(w/2, titleY, 'Capitol Conquest', 
      Config.textStyle('58px', Config.COLORS.TEXT_BRIGHT_GOLD, {
        fontWeight: 'bold',
        fontFamily: 'serif',
        stroke: '#8B4513',
        strokeThickness: 3
      })
    ).setOrigin(0.5).setDepth(12);
    
    // Add highlight effect
    this.add.text(w/2, titleY - 1, 'Capitol Conquest', 
      Config.textStyle('58px', '#FFFFFF', {
        fontWeight: 'bold',
        fontFamily: 'serif',
        stroke: '#FFD700',
        strokeThickness: 1
      })
    ).setOrigin(0.5).setDepth(13).setAlpha(0.6);
    
    // Add subtle glow effect with animated pulse
    const glowTitle = this.add.text(w/2, titleY, 'Capitol Conquest', 
      Config.textStyle('62px', Config.COLORS.TEXT_BRIGHT_GOLD, {
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
}

export class HelpScene extends Phaser.Scene {
  constructor(){ super('HelpScene'); }
  
  preload() {
    this.load.image('splash', Config.ASSETS.SPLASH_IMAGE);
  }
  
  create(){
    const w = this.scale.width; const h = this.scale.height;
    
    // Add background image
    const bg = this.add.image(w/2, h/2, 'splash');
    const scaleX = w / bg.width;
    const scaleY = h / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);
    
    // Add semi-transparent overlay
    this.add.rectangle(w/2, h/2, w, h, Config.COLORS.OVERLAY_DARK, 0.8);
    
    // Title
    this.add.text(w/2, 40, '🏛️ How to Play Capitol Conquest', 
      Config.textStyle(Config.FONT_SIZES.LARGE, Config.COLORS.TEXT_BRIGHT_GOLD)
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
• F - Forfeit game (in-game)
• S - Skip turn (in-game)

💡 STRATEGY TIPS:
• Use duplicates to expand territory safely
• Use jumps to reach strategic positions
• Think about conversions before moving
• Control the center for maximum influence`;

    // Scrolling setup without mask
    this.scrollY = 0;
    this.maxScrollY = 0;
    
    // Create the rules text
    this.rulesTextObj = this.add.text(50, 120, rulesText, 
      Config.textStyle(Config.FONT_SIZES.TINY, Config.COLORS.TEXT_WHITE, { 
        wordWrap: { width: w - 100 },
        lineSpacing: 5
      })
    );
    
    // Calculate max scroll based on content that goes below visible area
    const visibleAreaBottom = h - 50; // Leave some space at bottom
    const textBottom = this.rulesTextObj.y + this.rulesTextObj.height;
    this.maxScrollY = Math.max(0, textBottom - visibleAreaBottom);
    
    // Simple scroll with mouse wheel - just move the text up/down
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      this.scrollY += deltaY * 0.5;
      this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScrollY);
      this.rulesTextObj.y = 120 - this.scrollY;
    });
    
    // Back button (similar to GlobalStatsScene)
    const backBtn = this.add.text(40, 40, '← Back', 
      Config.textStyle(Config.FONT_SIZES.SMALL, Config.COLORS.TEXT_CYAN)
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
    
    // Add background image
    const bg = this.add.image(w/2, h/2, 'splash');
    const scaleX = w / bg.width;
    const scaleY = h / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);
    
    // Add semi-transparent overlay
    this.add.rectangle(w/2, h/2, w, h, Config.COLORS.OVERLAY_DARK, 0.3);
    
    this.add.text(w/2, h/2 - 160, 'Choose Your Side', Config.textStyle(Config.FONT_SIZES.LARGE, Config.COLORS.TEXT_WHITE)).setOrigin(0.5);
    
    // Color options
    const colorOptions = [
      { label:'Play as Red (Republicans)', playerId:1, playerColor:0xd94343, aiColor:0x3a52d9 },
      { label:'Play as Blue (Democrats)', playerId:2, playerColor:0x3a52d9, aiColor:0xd94343 }
    ];
    
    colorOptions.forEach((o,i)=>{
      const t = this.add.text(w/2, h/2 + i*60 - 80, o.label, 
        Config.textStyle(Config.FONT_SIZES.MEDIUM, Config.COLORS.TEXT_WHITE, {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          padding: { x: 16, y: 8 },
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
    this.add.text(w/2, h/2 + 50, 'Choose Difficulty Level', Config.textStyle(Config.FONT_SIZES.MEDIUM, Config.COLORS.TEXT_WHITE)).setOrigin(0.5);
    
    const difficultyOptions = [
      { label:'Normal (Equal Start)', ...Config.DIFFICULTY.LEVELS.NORMAL },
      { label:'Hard (AI starts with 2x pieces)', ...Config.DIFFICULTY.LEVELS.HARD },
      { label:'Expert (AI starts with 3x pieces)', ...Config.DIFFICULTY.LEVELS.EXPERT }
    ];
    
    // Store difficulty text objects for updating checkboxes
    this.difficultyTexts = [];
    
    difficultyOptions.forEach((o,i)=>{
      // Preselect normal difficulty (index 0)
      const isPreselected = o.difficulty === Config.DIFFICULTY.DEFAULT.difficulty;
      const checkboxText = (isPreselected ? '☑️ ' : '☐ ') + o.label;
      const textColor = isPreselected ? Config.COLORS.TEXT_GOLD : Config.COLORS.TEXT_WHITE;
      
      const t = this.add.text(w/2, h/2 + i*50 + 80, checkboxText, 
        Config.textStyle(Config.FONT_SIZES.SMALL, textColor)
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
