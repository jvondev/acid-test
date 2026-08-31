// 🌧️ 10X SATISFYING LIQUID ACID RAIN PHYSICS ENGINE
// Heavy Fluid Streams, Continuous Vertical Trails, Glowing Heads, Caustic Shimmer & Liquid Ripples

import { ScreenBuffer } from './buffer.js';
import { getGradientAnsi } from '../brand/index.js';

const BG_OBSIDIAN = '\x1b[48;2;11;15;23m';

export interface LiquidDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  layer: 0 | 1 | 2; // 0 = Foreground Heavy, 1 = Midground Steady, 2 = Background Mist
  opacity: number;
  splashAge: number;
  drift: number;
}

export class HeavyRainEngine {
  private drops: LiquidDrop[] = [];
  private cols = 110;
  private rows = 32;

  constructor(cols: number, rows: number, dropCount?: number) {
    this.cols = cols;
    this.rows = rows;
    const count = dropCount ?? Math.max(85, Math.floor(cols * 1.05));
    this.initDrops(count);
  }

  private initDrops(count: number): void {
    this.drops = [];
    for (let i = 0; i < count; i++) {
      this.drops.push(this.createDrop(true));
    }
  }

  private createDrop(randomY = false): LiquidDrop {
    const roll = Math.random();
    let layer: 0 | 1 | 2;
    let speed: number;
    let length: number;
    let opacity: number;

    if (roll < 0.35) {
      // Layer 0: Heavy glowing foreground streams
      layer = 0;
      speed = 0.85 + Math.random() * 0.45;
      length = 6 + Math.floor(Math.random() * 7); // 6 to 12 rows long
      opacity = 1.0;
    } else if (roll < 0.80) {
      // Layer 1: Steady midground liquid rain
      layer = 1;
      speed = 0.55 + Math.random() * 0.30;
      length = 4 + Math.floor(Math.random() * 5); // 4 to 8 rows long
      opacity = 0.78;
    } else {
      // Layer 2: Ambient background acid mist
      layer = 2;
      speed = 0.28 + Math.random() * 0.20;
      length = 2 + Math.floor(Math.random() * 3); // 2 to 4 rows long
      opacity = 0.45;
    }

    return {
      x: Math.floor(Math.random() * this.cols),
      y: randomY ? Math.random() * (this.rows + 10) - 5 : -Math.random() * 12,
      speed,
      length,
      layer,
      opacity,
      splashAge: 0,
      drift: (Math.random() - 0.5) * 0.03,
    };
  }

  public resize(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    const targetCount = Math.max(85, Math.floor(cols * 1.05));
    while (this.drops.length < targetCount) {
      this.drops.push(this.createDrop(true));
    }
    if (this.drops.length > targetCount) {
      this.drops.length = targetCount;
    }
  }

  public update(dt = 1.0): void {
    this.drops.forEach((drop) => {
      if (drop.splashAge > 0) {
        drop.splashAge += dt * 0.45;
        if (drop.splashAge > 3.5) {
          Object.assign(drop, this.createDrop(false));
        }
        return;
      }

      // Smooth continuous fluid descent
      drop.y += drop.speed * dt;
      drop.x += drop.drift * dt;
      if (drop.x < 0) drop.x = this.cols - 1;
      if (drop.x >= this.cols) drop.x = 0;

      // Bottom impact check
      if (drop.y >= this.rows - 1) {
        if (drop.layer === 0 || (drop.layer === 1 && Math.random() > 0.35)) {
          drop.splashAge = 1.0;
          drop.y = this.rows - 1;
        } else {
          Object.assign(drop, this.createDrop(false));
        }
      }
    });
  }

  public render(buffer: ScreenBuffer, boundBox?: { x: number; y: number; w: number; h: number }): void {
    const minX = boundBox ? boundBox.x : 0;
    const minY = boundBox ? boundBox.y : 0;
    const maxX = boundBox ? boundBox.x + boundBox.w : this.cols;
    const maxY = boundBox ? boundBox.y + boundBox.h : this.rows;

    this.drops.forEach((drop) => {
      const px = Math.floor(drop.x);
      const py = Math.floor(drop.y);

      // 1. Impact Splash Ripples
      if (drop.splashAge > 0) {
        if (px >= minX && px < maxX && py >= minY && py < maxY) {
          if (drop.splashAge < 1.6) {
            buffer.setCell(px, py, '•', { fg: '\x1b[38;2;163;230;53m', bold: true });
          } else if (drop.splashAge < 2.6) {
            buffer.setCell(px, py, '○', { fg: '\x1b[38;2;16;185;129m', bold: true });
            if (px > minX) buffer.setCell(px - 1, py, '·', { fg: '\x1b[38;2;34;197;94m' });
            if (px < maxX - 1) buffer.setCell(px + 1, py, '·', { fg: '\x1b[38;2;34;197;94m' });
          } else {
            buffer.setCell(px, py, '·', { fg: '\x1b[38;2;5;150;105m', dim: true });
          }
        }
        return;
      }

      // 2. Liquid Rain Trail: Luminous Head -> Continuous Fluid Stream -> Fading Tail
      for (let i = 0; i < drop.length; i++) {
        const segY = py - i;
        if (px >= minX && px < maxX && segY >= minY && segY < maxY) {
          const isHead = i === 0;
          let char: string;

          if (drop.layer === 0) {
            // Layer 0: Heavy luminous fluid stream
            if (isHead) char = '•';
            else if (i === 1) char = '┃';
            else if (i <= drop.length - 2) char = '│';
            else char = '·';
          } else if (drop.layer === 1) {
            // Layer 1: Steady fluid rain
            if (isHead) char = '•';
            else if (i <= drop.length - 2) char = '│';
            else char = '·';
          } else {
            // Layer 2: Background mist streak
            char = isHead ? '│' : '·';
          }

          // Caustic shimmer & gradient mapping
          const progress = 1 - i / drop.length;
          const caustic = Math.sin(px * 0.4 + segY * 0.3) * 0.08;
          let t: number;

          if (drop.layer === 0) {
            t = Math.max(0, Math.min(1, 0.45 + progress * 0.55 + caustic));
          } else if (drop.layer === 1) {
            t = Math.max(0, Math.min(1, 0.25 + progress * 0.65 + caustic));
          } else {
            t = Math.max(0, Math.min(1, progress * 0.4 + caustic));
          }

          const color = getGradientAnsi(t);

          buffer.setCell(px, segY, char, {
            fg: color,
            bold: isHead && drop.layer === 0,
            dim: drop.layer === 2 || (!isHead && i > 4),
          });
        }
      }
    });
  }
}
