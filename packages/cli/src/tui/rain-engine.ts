// 🌧️ 10X SATISFYING LIQUID ACID RAIN PHYSICS ENGINE
// Under 140 lines - Delicate Fluid Trails, Luminous Heads, and Calibrated Toxic Gradients

import { ScreenBuffer } from './buffer.js';
import { getGradientAnsi } from '../brand/index.js';

export interface LiquidDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number; // 0.2 to 1.0
  splashAge: number;
}

export class HeavyRainEngine {
  private drops: LiquidDrop[] = [];
  private cols = 110;
  private rows = 32;

  constructor(cols: number, rows: number, dropCount = 36) {
    this.cols = cols;
    this.rows = rows;
    this.initDrops(dropCount);
  }

  private initDrops(count: number): void {
    this.drops = [];
    for (let i = 0; i < count; i++) {
      this.drops.push(this.createDrop(true));
    }
  }

  private createDrop(randomY = false): LiquidDrop {
    const isHeavy = Math.random() > 0.6;
    return {
      x: Math.floor(Math.random() * this.cols),
      y: randomY ? Math.random() * this.rows : -Math.random() * 6,
      speed: isHeavy ? 0.65 + Math.random() * 0.25 : 0.35 + Math.random() * 0.2, // Calibrated soothing speed
      length: isHeavy ? 4 + Math.floor(Math.random() * 3) : 2 + Math.floor(Math.random() * 2),
      opacity: isHeavy ? 0.95 : 0.45,
      splashAge: 0,
    };
  }

  public resize(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
  }

  public update(dt = 1.0): void {
    this.drops.forEach((drop) => {
      if (drop.splashAge > 0) {
        drop.splashAge += dt;
        if (drop.splashAge > 4) {
          Object.assign(drop, this.createDrop(false));
        }
        return;
      }

      // Smooth downward descent
      drop.y += drop.speed * dt;

      // Bottom impact check
      if (drop.y >= this.rows - 1) {
        if (drop.opacity > 0.7 && Math.random() > 0.5) {
          drop.splashAge = 1;
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

    const tailChars = ['│', '┆', '╎', '·'];

    this.drops.forEach((drop) => {
      const px = Math.floor(drop.x);
      const py = Math.floor(drop.y);

      // 1. Splash ripple upon impact
      if (drop.splashAge > 0) {
        if (px >= minX && px < maxX - 2 && py >= minY && py < maxY) {
          const splashChar = drop.splashAge < 2 ? '•' : drop.splashAge < 4 ? '·' : ' ';
          buffer.setCell(px, py, splashChar, { fg: '\x1b[38;2;163;230;53m', bold: true });
        }
        return;
      }

      // 2. Liquid Rain Trail (Luminous Head -> Slender Tail)
      for (let i = 0; i < drop.length; i++) {
        const segY = py - i;
        if (px >= minX && px < maxX && segY >= minY && segY < maxY) {
          const isHead = i === 0;
          const char = isHead ? '•' : tailChars[Math.min(i - 1, tailChars.length - 1)];

          const t = Math.max(0, Math.min(1, (px / this.cols) * 0.6 + (1 - i / drop.length) * 0.4));
          const color = getGradientAnsi(t);

          buffer.setCell(px, segY, char, {
            fg: color,
            bold: isHead && drop.opacity > 0.7,
            dim: !isHead || drop.opacity < 0.6,
          });
        }
      }
    });
  }
}
