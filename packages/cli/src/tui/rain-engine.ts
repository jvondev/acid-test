// 🧪 AVANT-GARDE PREMIUM CHEMICAL ACID DROPLET SIMULATION ENGINE
// Precision Acid Titration Drops, Luminous Meniscus Heads, Viscous Ion Trails & Sizzling Surface Reactions
// Zero-Allocation In-Place Particle Pooling & Sub-Cell Fluid Physics

import { ScreenBuffer } from './buffer.js';
import { getGradientAnsi } from '../brand/index.js';

export interface LiquidDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  layer: 0 | 1 | 2 | 3; // 0 = Luminous Acid Droplet, 1 = Steady Stream, 2 = Acidic Vapor Aerosol, 3 = Hyper Probe
  opacity: number;
  splashAge: number;
  drift: number;
  headGlyph: string;
  hasSatellite: boolean;
}

export class HeavyRainEngine {
  private drops: LiquidDrop[] = [];
  private cols = 110;
  private rows = 32;

  constructor(cols: number, rows: number, dropCount?: number) {
    this.cols = Math.max(40, cols);
    this.rows = Math.max(10, rows);
    const count = dropCount ?? Math.max(75, Math.floor(this.cols * 0.95));
    this.initDrops(count);
  }

  private initDrops(count: number): void {
    this.drops = [];
    for (let i = 0; i < count; i++) {
      this.drops.push(this.createDrop(true));
    }
  }

  private createDrop(randomY = false): LiquidDrop {
    const drop: LiquidDrop = {
      x: 0,
      y: 0,
      speed: 0.8,
      length: 6,
      layer: 0,
      opacity: 1.0,
      splashAge: 0,
      drift: 0,
      headGlyph: '●',
      hasSatellite: false,
    };
    this.resetDrop(drop, randomY);
    return drop;
  }

  private resetDrop(drop: LiquidDrop, randomY = false): void {
    const roll = Math.random();

    if (roll < 0.32) {
      // Layer 0: Heavy Luminous Titration Acid Droplets (Hero Meniscus Droplets)
      drop.layer = 0;
      drop.speed = 0.75 + Math.random() * 0.40;
      drop.length = 5 + Math.floor(Math.random() * 6);
      drop.opacity = 1.0;
      const heads = ['●', '◉', '◆', '●', '●'];
      drop.headGlyph = heads[Math.floor(Math.random() * heads.length)];
      drop.hasSatellite = Math.random() > 0.40;
      drop.drift = (Math.random() - 0.5) * 0.02;
    } else if (roll < 0.75) {
      // Layer 1: Steady Precipitation Streams
      drop.layer = 1;
      drop.speed = 0.50 + Math.random() * 0.28;
      drop.length = 3 + Math.floor(Math.random() * 4);
      drop.opacity = 0.82;
      drop.headGlyph = '•';
      drop.hasSatellite = false;
      drop.drift = (Math.random() - 0.5) * 0.02;
    } else if (roll < 0.94) {
      // Layer 2: Ambient Chemical Vapor / Aerosol Micro-Mist
      drop.layer = 2;
      drop.speed = 0.22 + Math.random() * 0.18;
      drop.length = 1 + Math.floor(Math.random() * 2);
      drop.opacity = 0.45;
      drop.headGlyph = Math.random() > 0.5 ? '·' : '˙';
      drop.hasSatellite = false;
      drop.drift = (Math.random() - 0.5) * 0.05; // Gentle Brownian drift
    } else {
      // Layer 3: Kinetic Hyper-Speed Acid Test Probes
      drop.layer = 3;
      drop.speed = 1.45 + Math.random() * 0.65;
      drop.length = 8 + Math.floor(Math.random() * 8);
      drop.opacity = 1.0;
      drop.headGlyph = '◆';
      drop.hasSatellite = true;
      drop.drift = (Math.random() - 0.5) * 0.01;
    }

    drop.x = Math.floor(Math.random() * this.cols);
    drop.y = randomY ? Math.random() * (this.rows + 8) - 4 : -Math.random() * 10 - 2;
    drop.splashAge = 0;
  }

  public resize(cols: number, rows: number): void {
    this.cols = Math.max(40, cols);
    this.rows = Math.max(10, rows);
    const targetCount = Math.max(75, Math.floor(cols * 0.95));
    while (this.drops.length < targetCount) {
      this.drops.push(this.createDrop(true));
    }
    if (this.drops.length > targetCount) {
      this.drops.length = targetCount;
    }
  }

  public update(dt = 1.0): void {
    const totalDrops = this.drops.length;
    for (let i = 0; i < totalDrops; i++) {
      const drop = this.drops[i];

      // Sizzling surface chemical reaction lifecycle
      if (drop.splashAge > 0) {
        drop.splashAge += dt * 0.38;
        if (drop.splashAge > 3.4) {
          this.resetDrop(drop, false);
        }
        continue;
      }

      // Smooth continuous fluid descent with surface tension drift
      drop.y += drop.speed * dt;
      drop.x += drop.drift * dt;

      if (drop.x < 0) drop.x = this.cols - 1;
      if (drop.x >= this.cols) drop.x = 0;

      // Bottom surface impact detection
      if (drop.y >= this.rows - 1) {
        if (drop.layer === 0 || drop.layer === 3 || (drop.layer === 1 && Math.random() > 0.30)) {
          drop.splashAge = 0.8;
          drop.y = this.rows - 1;
        } else {
          this.resetDrop(drop, false);
        }
      }
    }
  }

  public render(buffer: ScreenBuffer, boundBox?: { x: number; y: number; w: number; h: number }): void {
    const minX = boundBox ? boundBox.x : 0;
    const minY = boundBox ? boundBox.y : 0;
    const maxX = boundBox ? boundBox.x + boundBox.w : this.cols;
    const maxY = boundBox ? boundBox.y + boundBox.h : this.rows;

    const totalDrops = this.drops.length;
    for (let d = 0; d < totalDrops; d++) {
      const drop = this.drops[d];
      const px = Math.floor(drop.x);
      const py = Math.floor(drop.y);

      // 1. Chemical Reaction Surface Splash
      if (drop.splashAge > 0) {
        if (px >= minX && px < maxX && py >= minY && py < maxY) {
          if (drop.splashAge < 1.4) {
            // Stage 1: Corrosive Impact Flash
            buffer.setCell(px, py, '●', { fg: '\x1b[38;2;163;230;53m', bold: true });
            if (px > minX) buffer.setCell(px - 1, py, '‹', { fg: '\x1b[38;2;132;204;22m' });
            if (px < maxX - 1) buffer.setCell(px + 1, py, '›', { fg: '\x1b[38;2;132;204;22m' });
          } else if (drop.splashAge < 2.4) {
            // Stage 2: Sizzling Caustic Crown & Secondary Droplet Scatter
            buffer.setCell(px, py, '○', { fg: '\x1b[38;2;34;197;94m', bold: true });
            if (px > minX) buffer.setCell(px - 1, py, '·', { fg: '\x1b[38;2;16;185;129m' });
            if (px < maxX - 1) buffer.setCell(px + 1, py, '·', { fg: '\x1b[38;2;16;185;129m' });
            if (py > minY) buffer.setCell(px, py - 1, '˙', { fg: '\x1b[38;2;163;230;53m', dim: true });
          } else {
            // Stage 3: Neutralized Vapor Dissipation
            buffer.setCell(px, py, '˙', { fg: '\x1b[38;2;5;150;105m', dim: true });
          }
        }
        continue;
      }

      // 2. Liquid Viscous Droplet & Ion Stream
      for (let i = 0; i < drop.length; i++) {
        const segY = py - i;
        if (px >= minX && px < maxX && segY >= minY && segY < maxY) {
          const isHead = i === 0;
          let char: string;

          if (drop.layer === 0) {
            // Layer 0: Heavy Titration Droplet
            if (isHead) char = drop.headGlyph;
            else if (i === 1) char = '┃';
            else if (i <= drop.length - 2) char = '│';
            else char = '╎';
          } else if (drop.layer === 1) {
            // Layer 1: Steady Stream
            if (isHead) char = drop.headGlyph;
            else if (i <= drop.length - 2) char = '│';
            else char = '·';
          } else if (drop.layer === 3) {
            // Layer 3: Kinetic Hyper Probe
            if (isHead) char = '◆';
            else if (i <= 2) char = '┃';
            else if (i <= drop.length - 2) char = '│';
            else char = '·';
          } else {
            // Layer 2: Vapor Aerosol
            char = drop.headGlyph;
          }

          // Caustic luminescence & gradient mapping across brand hues
          const progress = 1 - i / drop.length;
          let t: number;

          if (drop.layer === 0) {
            t = 0.50 + progress * 0.50; // #22C55E -> #A3E635 (Toxic Green to Luminous Lime)
          } else if (drop.layer === 3) {
            t = 0.65 + progress * 0.35; // Bright Neon Lime
          } else if (drop.layer === 1) {
            t = 0.30 + progress * 0.55; // #10B981 -> #84CC16 (Emerald to Lime)
          } else {
            t = progress * 0.35;        // #059669 (Deep Ambient Jade)
          }

          const color = getGradientAnsi(t);

          buffer.setCell(px, segY, char, {
            fg: color,
            bold: isHead && (drop.layer === 0 || drop.layer === 3),
            dim: drop.layer === 2 || (!isHead && i > 4),
          });
        }
      }

      // 3. Pinch-Off Satellite Micro-Droplet (Real Fluid Surface Tension)
      if (drop.hasSatellite && drop.length >= 4) {
        const satY = py - drop.length - 2;
        if (px >= minX && px < maxX && satY >= minY && satY < maxY) {
          buffer.setCell(px, satY, '·', {
            fg: getGradientAnsi(0.35),
            dim: true,
          });
        }
      }
    }
  }
}
