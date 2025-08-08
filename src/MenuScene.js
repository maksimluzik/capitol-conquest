// MenuScene.js - main menu and help scenes
import { GameScene } from './GameScene.js';

export class MenuScene extends Phaser.Scene {
  constructor(){ super('MenuScene'); }
  create(){
    const w = this.scale.width; const h = this.scale.height;
    this.add.text(w/2, h/2 - 140, 'Capitol Conquest', { fontFamily:'Arial', fontSize:'50px', color:'#222'}).setOrigin(0.5);
    const options = [
      { label:'Single Player (vs AI)', mode:'single' },
      { label:'Two Player Local', mode:'two' },
      { label:'Help / Rules', mode:'help' }
    ];
    this.items = [];
    options.forEach((o,i)=>{
      const t = this.add.text(w/2, h/2 + i*60 - 20, o.label, { fontFamily:'Arial', fontSize:'30px', color:'#0a3d91'}).setOrigin(0.5).setInteractive({ useHandCursor:true });
      t.on('pointerover', ()=> t.setStyle({ color:'#d94343'}));
      t.on('pointerout', ()=> t.setStyle({ color:'#0a3d91'}));
      t.on('pointerdown', ()=> this._select(o));
      this.items.push(t);
    });
    this.sel = 0; this._hilite();
    this.input.keyboard.on('keydown-UP', ()=> this._move(-1));
    this.input.keyboard.on('keydown-DOWN', ()=> this._move(1));
    this.input.keyboard.on('keydown-ENTER', ()=> this._activate());
  }
  _move(d){ this.sel = (this.sel + d + this.items.length) % this.items.length; this._hilite(); }
  _hilite(){ this.items.forEach((it,i)=> it.setStyle({ fontStyle: i===this.sel? 'bold':'normal'})); }
  _activate(){ const map = ['single','two','help']; this._select({ mode: map[this.sel] }); }
  _select(o){ if (o.mode==='help'){ this.scene.start('HelpScene'); return; } this.scene.start('GameScene',{ mode:o.mode }); }
}

export class HelpScene extends Phaser.Scene {
  constructor(){ super('HelpScene'); }
  create(){
    const txt = `Rules:\nSelect a piece. Green = duplicate (distance 1). Yellow = jump (distance 2).\nDuplicate keeps original; jump removes it. Adjacent enemy pieces convert after move.\nGoal: finish with more pieces. Press M for Menu.`;
    this.add.text(40,40,txt,{ fontFamily:'Arial', fontSize:'20px', color:'#222', wordWrap:{ width:this.scale.width-80 }});
    this.input.keyboard.on('keydown-M', ()=> this.scene.start('MenuScene'));
  }
}

// Ensure GameScene is registered by import side-effect when using scene array.
