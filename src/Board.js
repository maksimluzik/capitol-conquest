// Board.js - hex grid creation and management
export class Board {
  constructor(scene, options) {
    this.scene = scene;
    this.size = options.size || 8; // radius in axial coords
    this.hexSize = options.hexSize || 30;
    // Rotation in degrees applied to hex geometry only (does not alter spacing math)
    this.rotationDeg = options.rotationDeg != null ? options.rotationDeg : 30; // user requested ~45°
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

    // Add ambient background effects
    this.addBackgroundEffects();

    for (let q = -this.size; q <= this.size; q++) {
      for (let r = -this.size; r <= this.size; r++) {
        if (Math.abs(q + r) > this.size) continue; // constrain to hex shape
        const x = offsetX + this.hexSize * 1.5 * q;
        const y = offsetY + hexHeight * (r + q / 2);
        
        // Vary hex colors slightly for more natural appearance
        const distance = Math.abs(q) + Math.abs(r) + Math.abs(q + r);
        const baseColor = 0xdddddd;
        const variation = Math.floor(distance * 3) % 20 - 10; // ±10 color variation
        const variedColor = this.adjustColor(baseColor, variation);
        
        const hex = this.drawHex(x, y, this.hexSize, variedColor);
        // Store axial coords, piece ref, and geometric center for later lookups
        hex.setData({ q, r, piece: null, cx: x, cy: y });
        this.hexMap.set(this.axialKey(q, r), hex);
      }
    }
  }

  addBackgroundEffects() {
    // Add subtle radial gradient background
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;
    const maxRadius = Math.max(this.scene.scale.width, this.scene.scale.height);
    
    const bgGraphics = this.scene.add.graphics();
    bgGraphics.setDepth(-10);
    
    // Create radial gradient effect with multiple circles
    for (let i = 0; i < 8; i++) {
      const radius = (maxRadius / 8) * (i + 1);
      const alpha = 0.03 * (8 - i) / 8;
      bgGraphics.fillStyle(0x4a5568, alpha);
      bgGraphics.fillCircle(centerX, centerY, radius);
    }
    
    // Add subtle particle-like dots for ambiance
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * this.scene.scale.width;
      const y = Math.random() * this.scene.scale.height;
      const size = 1 + Math.random() * 2;
      bgGraphics.fillStyle(0xffffff, 0.1);
      bgGraphics.fillCircle(x, y, size);
    }
  }

  adjustColor(baseColor, variation) {
    const color = Phaser.Display.Color.IntegerToColor(baseColor);
    const r = Math.max(0, Math.min(255, color.red + variation));
    const g = Math.max(0, Math.min(255, color.green + variation));
    const b = Math.max(0, Math.min(255, color.blue + variation));
    return Phaser.Display.Color.GetColor(r, g, b);
  }

  drawHex(cx, cy, radius, fillColor) {
    // Create a highly stylized 3D hex with advanced Phaser effects
    const container = this.scene.add.container(cx, cy);
    
    // Create multiple layers for depth effect
    const shadowLayer = this.scene.add.graphics();
    const baseLayer = this.scene.add.graphics();
    const highlightLayer = this.scene.add.graphics();
    const rimLayer = this.scene.add.graphics();
    
    const rot = Phaser.Math.DegToRad(this.rotationDeg);
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = Phaser.Math.DegToRad(60 * i - 30) + rot;
      points.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
    }
    
    // Enhanced drop shadow with blur simulation (multiple offset layers)
    for (let blur = 0; blur < 4; blur++) {
      const offset = 4 + blur;
      const alpha = 0.08 / (blur + 1);
      shadowLayer.fillStyle(0x000000, alpha);
      shadowLayer.beginPath();
      shadowLayer.moveTo(points[0].x + offset, points[0].y + offset);
      for (let i = 1; i < points.length; i++) {
        shadowLayer.lineTo(points[i].x + offset, points[i].y + offset);
      }
      shadowLayer.closePath();
      shadowLayer.fillPath();
    }
    
    // Base hex with gradient simulation (concentric fills getting brighter)
    const gradientSteps = 6;
    for (let step = gradientSteps; step >= 0; step--) {
      const t = step / gradientSteps;
      const currentRadius = radius * (0.7 + 0.3 * t);
      const brightness = 0.85 + 0.15 * (1 - t);
      
      // Darken the base color and brighten towards center
      const baseCol = Phaser.Display.Color.IntegerToColor(fillColor);
      const adjustedColor = Phaser.Display.Color.GetColor(
        Math.floor(baseCol.red * brightness),
        Math.floor(baseCol.green * brightness), 
        Math.floor(baseCol.blue * brightness)
      );
      
      baseLayer.fillStyle(adjustedColor, 1);
      baseLayer.beginPath();
      baseLayer.moveTo(points[0].x * (currentRadius/radius), points[0].y * (currentRadius/radius));
      for (let i = 1; i < points.length; i++) {
        baseLayer.lineTo(points[i].x * (currentRadius/radius), points[i].y * (currentRadius/radius));
      }
      baseLayer.closePath();
      baseLayer.fillPath();
    }
    
    // Outer rim with dark edge for definition
    baseLayer.lineStyle(2, 0x111111, 0.8);
    baseLayer.beginPath();
    baseLayer.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) baseLayer.lineTo(points[i].x, points[i].y);
    baseLayer.closePath();
    baseLayer.strokePath();
    
    // Directional highlight (top-left lighting)
    const lightAngle = Math.PI * 1.25; // top-left
    for (let i = 0; i < 6; i++) {
      const edgeAngle = Math.PI/3 * i + rot;
      const lightDot = Math.max(0, Math.cos(edgeAngle - lightAngle));
      const intensity = lightDot * 0.4;
      
      if (intensity > 0.1) {
        highlightLayer.lineStyle(3, 0xffffff, intensity);
        highlightLayer.beginPath();
        highlightLayer.moveTo(points[i].x, points[i].y);
        highlightLayer.lineTo(points[(i + 1) % 6].x, points[(i + 1) % 6].y);
        highlightLayer.strokePath();
      }
    }
    
    // Inner glow effect
    for (let glow = 0; glow < 3; glow++) {
      const glowRadius = radius * (0.4 - glow * 0.1);
      const glowAlpha = 0.15 / (glow + 1);
      highlightLayer.fillStyle(0xffffff, glowAlpha);
      highlightLayer.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = Math.PI/3 * i + rot;
        const x = glowRadius * Math.cos(angle);
        const y = glowRadius * Math.sin(angle);
        if (i === 0) highlightLayer.moveTo(x, y);
        else highlightLayer.lineTo(x, y);
      }
      highlightLayer.closePath();
      highlightLayer.fillPath();
    }
    
    // Specular highlight (small bright spot)
    const specX = radius * -0.3;
    const specY = radius * -0.3;
    rimLayer.fillStyle(0xffffff, 0.6);
    rimLayer.fillEllipse(specX, specY, 4, 2);
    
    // Add all layers to container with proper depth
    container.add([shadowLayer, baseLayer, highlightLayer, rimLayer]);
    container.setDepth(0);
    
    // Apply subtle scale tween for living board effect
    this.scene.tweens.add({
      targets: container,
      scaleX: { from: 1, to: 1.02 },
      scaleY: { from: 1, to: 1.02 },
      duration: 2000 + Math.random() * 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });
    
    // Interactive polygon (reuse existing logic but adjust for container)
    const localPoints = points.map(p => new Phaser.Geom.Point(p.x, p.y));
    const geomPoly = new Phaser.Geom.Polygon(localPoints);
    const flatPoints = localPoints.flatMap(p => [p.x, p.y]);
    const poly = this.scene.add.polygon(cx, cy, flatPoints, 0x000000, 0);
    poly.setStrokeStyle();
    poly.setDepth(1);
    poly.setInteractive(geomPoly, Phaser.Geom.Polygon.Contains, { useHandCursor: true });
    
    // Store reference and forward events
    container.setData('hit', poly);
    poly.on('pointerdown', (pointer) => container.emit('pointerdown', pointer));
    poly.on('pointerover', (pointer) => container.emit('pointerover', pointer));
    poly.on('pointerout', (pointer) => container.emit('pointerout', pointer));
    
    return container;
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
