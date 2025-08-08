// MenuScene.js - main menu and help scenes
import { GameScene } from './GameScene.js';
import { loadScores, resetScores } from './PersistentScores.js';
import { Config } from './config.js';

export class MenuScene extends Phaser.Scene {
  constructor(){ super('MenuScene'); }
  
  preload() {
    // Load the background image
    this.load.image('splash', Config.ASSETS.SPLASH_IMAGE);
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
    
    this.add.text(w/2, h/2 - 140, 'Capitol Conquest', Config.textStyle(Config.FONT_SIZES.TITLE, Config.COLORS.TEXT_WHITE)).setOrigin(0.5);
    const options = [
      { label:'Single Player (vs AI)', mode:'single' },
      { label:'Two Player Local', mode:'two' },
      { label:'Global Statistics', mode:'stats' },
      { label:'Help / Rules', mode:'help' },
      { label:'Reset Scores', mode:'reset' }
    ];
    this.items = [];
    options.forEach((o,i)=>{
      const t = this.add.text(w/2, h/2 + i*60 - 20, o.label, Config.textStyle(Config.FONT_SIZES.MEDIUM, Config.COLORS.TEXT_WHITE)).setOrigin(0.5).setInteractive({ useHandCursor:true });
      t.on('pointerover', ()=> t.setStyle({ color: Config.COLORS.TEXT_GOLD})); 
      t.on('pointerout', ()=> t.setStyle({ color: Config.COLORS.TEXT_WHITE})); 
      t.on('pointerdown', ()=> this._select(o));
      this.items.push(t);
    });
    this.sel = 0; this._hilite();
    this.input.keyboard.on('keydown-UP', ()=> this._move(-1));
    this.input.keyboard.on('keydown-DOWN', ()=> this._move(1));
    this.input.keyboard.on('keydown-ENTER', ()=> this._activate());
  this._renderScores();
  }
  _move(d){ this.sel = (this.sel + d + this.items.length) % this.items.length; this._hilite(); }
  _hilite(){ this.items.forEach((it,i)=> it.setStyle({ fontStyle: i===this.sel? 'bold':'normal'})); }
  _activate(){ const map = ['single','two','stats','help']; this._select({ mode: map[this.sel] }); }
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
    this.add.text(w/2, 40, 'How to Play Capitol Conquest 🏛️', 
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

    this.add.text(50, 120, rulesText, 
      Config.textStyle(Config.FONT_SIZES.TINY, Config.COLORS.TEXT_WHITE, { 
        wordWrap: { width: w - 100 },
        lineSpacing: 5
      })
    );
    
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
    
    this.add.text(w/2, h/2 - 120, 'Choose Your Side', Config.textStyle(Config.FONT_SIZES.LARGE, Config.COLORS.TEXT_WHITE)).setOrigin(0.5);
    const options = [
      { label:'Play as Red (Republicans)', playerId:1, playerColor:0xd94343, aiColor:0x3a52d9 },
      { label:'Play as Blue (Democrats)', playerId:2, playerColor:0x3a52d9, aiColor:0xd94343 }
    ];
    options.forEach((o,i)=>{
      const t = this.add.text(w/2, h/2 + i*70 - 10, o.label, Config.textStyle(Config.FONT_SIZES.MEDIUM, Config.COLORS.TEXT_WHITE)).setOrigin(0.5).setInteractive({ useHandCursor:true });
      t.on('pointerover', ()=> t.setStyle({ color: Config.COLORS.TEXT_GOLD}));
      t.on('pointerout', ()=> t.setStyle({ color: Config.COLORS.TEXT_WHITE}));
      t.on('pointerdown', ()=> this._choose(o));
    });
    this.input.keyboard.on('keydown-ESC', ()=> this.scene.start('MenuScene'));
  }
  _choose(o){
    // Pass custom player colors to GameScene
    this.scene.start('GameScene', { mode:'single', playerChoice:o });
  }
}

// Ensure GameScene is registered by import side-effect when using scene array.
