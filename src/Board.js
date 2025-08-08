// Board.js - hex grid creation and management
export class Board {
  constructor(scene, options) {
    this.scene = scene;
    this.size = options.size || 8; // radius in axial coords
    this.hexSize = options.hexSize || 30;
    this.container = scene.add.layer();
    this.hexMap = new Map(); // key: "q,r" -> hex graphics object
  }

  axialKey(q, r) { return `${q},${r}`; }
  getHex(q, r) { return this.hexMap.get(this.axialKey(q, r)); }
  forEachHex(cb) { this.hexMap.forEach(cb); }

  generate() {
    const offsetX = this.scene.scale.width / 2;
    const offsetY = this.scene.scale.height / 2;
    const hexHeight = this.hexSize * Math.sqrt(3);

    for (let q = -this.size; q <= this.size; q++) {
      for (let r = -this.size; r <= this.size; r++) {
        if (Math.abs(q + r) > this.size) continue; // constrain to hex shape
        const x = offsetX + this.hexSize * 1.5 * q;
        const y = offsetY + hexHeight * (r + q / 2);
  const hex = this.drawHex(x, y, this.hexSize, 0xdddddd);
  // Store axial coords, piece ref, and geometric center for later lookups
  hex.setData({ q, r, piece: null, cx: x, cy: y });
        this.hexMap.set(this.axialKey(q, r), hex);
      }
    }
  }

  drawHex(cx, cy, radius, fillColor) {
    const graphics = this.scene.add.graphics();
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = Phaser.Math.DegToRad(60 * i - 30);
      points.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
    }
    // Gradient fill using a texture trick: draw solid first, then overlay highlight
    graphics.lineStyle(1, 0x333333, 1);
    graphics.fillStyle(fillColor, 1);
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) graphics.lineTo(points[i].x, points[i].y);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();

    // Subtle inner highlight to suggest bevel
    graphics.fillStyle(0xffffff, 0.08);
    graphics.beginPath();
    const inset = radius * 0.85;
    for (let i = 0; i < 6; i++) {
      const angle = Phaser.Math.DegToRad(60 * i - 30);
      const x = cx + inset * Math.cos(angle);
      const y = cy + inset * Math.sin(angle);
      if (i === 0) graphics.moveTo(x, y); else graphics.lineTo(x, y);
    }
    graphics.closePath();
    graphics.fillPath();

    graphics.setDepth(0);
    // Convert to interactive polygon hit area for precise picking
  // Build local-space points for display & hit area (relative to center)
  const localPoints = points.map(p => new Phaser.Geom.Point(p.x - cx, p.y - cy));
  const geomPoly = new Phaser.Geom.Polygon(localPoints);
  const flatPoints = localPoints.flatMap(p => [p.x, p.y]);
  const poly = this.scene.add.polygon(cx, cy, flatPoints, 0x000000, 0); // transparent visuals
  poly.setStrokeStyle();
  poly.setDepth(1);
  // Explicit interactive area uses geom polygon and its contains check
  poly.setInteractive(geomPoly, Phaser.Geom.Polygon.Contains, { useHandCursor: true });
  graphics.setData('hit', poly);
  // Make the polygon the interactive surface (Graphics lacks auto size for hit area)
  // Already set interactive above
  // Forward key pointer events so external code can listen on the graphics reference if desired
  poly.on('pointerdown', (pointer) => graphics.emit('pointerdown', pointer));
  poly.on('pointerover', (pointer) => graphics.emit('pointerover', pointer));
  poly.on('pointerout', (pointer) => graphics.emit('pointerout', pointer));
  return graphics; // treat graphics as the hex object interface
  }

  highlightHex(q, r, color) {
    const hex = this.getHex(q, r);
    if (!hex) return;
    hex.setTint?.(color); // if converted to image later
    // For Graphics, redraw overlay highlight
    const overlay = this.scene.add.circle(0,0,0,0); // placeholder if needed
  }

  setHexFill(q, r, color) {
    const hex = this.getHex(q, r);
    if (!hex) return;
    // Simplest approach: store desired color and mark dirty (full redraw not implemented for brevity)
  }
}
