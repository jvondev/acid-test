// 🏛️ ACID-TEST 2D SCREEN BUFFER (HIGH-PERFORMANCE DIFFERENTIAL RASTERIZER)
// Zero-Allocation In-Place Cell Pool, Double-Buffering & DEC Mode 2026 Synchronized Output
// Eliminates CPU lag, pipe saturation, and screen tearing with O(dirty_cells) delta rasterization

export interface CellStyle {
  fg?: string;
  bg?: string;
  bold?: boolean;
  dim?: boolean;
}

export interface Cell {
  char: string;
  fg?: string;
  bg?: string;
  bold?: boolean;
  dim?: boolean;
}

export class ScreenBuffer {
  public cols: number;
  public rows: number;
  private currentGrid: Cell[][];
  private previousGrid: Cell[][];
  private isDirty = true;
  private forceFullRedraw = true;

  constructor(cols: number, rows: number) {
    this.cols = Math.max(40, cols);
    this.rows = Math.max(10, rows);
    this.currentGrid = this.createEmptyGrid();
    this.previousGrid = this.createEmptyGrid();
  }

  private createEmptyGrid(): Cell[][] {
    const g: Cell[][] = [];
    for (let y = 0; y < this.rows; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < this.cols; x++) {
        row.push({ char: ' ' });
      }
      g.push(row);
    }
    return g;
  }

  public clear(): void {
    for (let y = 0; y < this.rows; y++) {
      const row = this.currentGrid[y];
      for (let x = 0; x < this.cols; x++) {
        const cell = row[x];
        cell.char = ' ';
        cell.fg = undefined;
        cell.bg = undefined;
        cell.bold = undefined;
        cell.dim = undefined;
      }
    }
    this.isDirty = true;
  }

  public resize(cols: number, rows: number): void {
    this.cols = Math.max(40, cols);
    this.rows = Math.max(10, rows);
    this.currentGrid = this.createEmptyGrid();
    this.previousGrid = this.createEmptyGrid();
    this.forceFullRedraw = true;
    this.isDirty = true;
  }

  public forceRedraw(): void {
    this.forceFullRedraw = true;
    this.isDirty = true;
  }

  public setCell(x: number, y: number, char: string, style: CellStyle = {}): void {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return;
    const cell = this.currentGrid[y][x];
    cell.char = char || ' ';
    cell.fg = style.fg;
    cell.bg = style.bg;
    cell.bold = style.bold;
    cell.dim = style.dim;
    this.isDirty = true;
  }

  public drawText(
    x: number,
    y: number,
    text: string,
    style: CellStyle = {},
    maxWidth?: number
  ): number {
    if (y < 0 || y >= this.rows) return 0;
    const limit = maxWidth !== undefined ? Math.min(maxWidth, this.cols - x) : this.cols - x;
    const chars = Array.from(text);
    let drawn = 0;

    for (let i = 0; i < chars.length && drawn < limit; i++) {
      const targetX = x + drawn;
      if (targetX >= this.cols) break;
      this.setCell(targetX, y, chars[i], style);
      drawn++;
    }
    return drawn;
  }

  public drawBox(
    x: number,
    y: number,
    w: number,
    h: number,
    title?: string,
    style: CellStyle = { fg: '\x1b[38;2;71;85;105m' }
  ): void {
    if (w < 2 || h < 2) return;

    this.setCell(x, y, '╭', style);
    this.setCell(x + w - 1, y, '╮', style);
    this.setCell(x, y + h - 1, '╰', style);
    this.setCell(x + w - 1, y + h - 1, '╯', style);

    for (let i = 1; i < w - 1; i++) {
      this.setCell(x + i, y, '─', style);
      this.setCell(x + i, y + h - 1, '─', style);
    }

    for (let j = 1; j < h - 1; j++) {
      this.setCell(x, y + j, '│', style);
      this.setCell(x + w - 1, y + j, '│', style);
    }

    if (title && w > title.length + 4) {
      this.drawText(x + 2, y, ` ${title} `, { ...style, bold: true, fg: '\x1b[38;2;248;250;252m' });
    }
  }

  /**
   * Flushes the buffer using DEC Mode 2026 Synchronized Output and Double-Buffered Differential Diffing.
   * Only emits cursor jumps and ANSI sequences for cells that actually changed since last frame.
   * If zero cells changed, 0 bytes are emitted to stdout.
   */
  public flush(): void {
    if (!this.isDirty) return;

    const SYNC_BEGIN = '\x1b[?2026h'; // DEC Mode 2026: Begin Synchronized Output
    const SYNC_END   = '\x1b[?2026l'; // DEC Mode 2026: End Synchronized Output
    const HIDE_CURSOR = '\x1b[?25l';
    const RESET       = '\x1b[0m';

    let out = '';
    let currentFg = '';
    let currentBg = '';
    let currentBold = false;
    let currentDim = false;

    let cursorX = -1;
    let cursorY = -1;
    let hasChanges = false;

    const isFull = this.forceFullRedraw;

    for (let y = 0; y < this.rows; y++) {
      const curRow = this.currentGrid[y];
      const prevRow = this.previousGrid[y];

      for (let x = 0; x < this.cols; x++) {
        const curCell = curRow[x];
        const prevCell = prevRow[x];

        // Differential check: skip if identical to previous frame
        if (
          !isFull &&
          curCell.char === prevCell.char &&
          curCell.fg === prevCell.fg &&
          curCell.bg === prevCell.bg &&
          curCell.bold === prevCell.bold &&
          curCell.dim === prevCell.dim
        ) {
          continue;
        }

        if (!hasChanges) {
          hasChanges = true;
          out += SYNC_BEGIN + HIDE_CURSOR;
          if (isFull) {
            out += '\x1b[2J\x1b[H';
            cursorX = 0;
            cursorY = 0;
          }
        }

        // Jump cursor if not positioned at target cell
        if (cursorX !== x || cursorY !== y) {
          out += `\x1b[${y + 1};${x + 1}H`;
          cursorX = x;
          cursorY = y;
        }

        // Apply style changes only when style delta occurs
        const targetFg = curCell.fg || '';
        const targetBg = curCell.bg || '';
        const targetBold = !!curCell.bold;
        const targetDim = !!curCell.dim;

        if (
          targetFg !== currentFg ||
          targetBg !== currentBg ||
          targetBold !== currentBold ||
          targetDim !== currentDim
        ) {
          out += RESET;
          currentFg = targetFg;
          currentBg = targetBg;
          currentBold = targetBold;
          currentDim = targetDim;

          if (currentBold) out += '\x1b[1m';
          if (currentDim) out += '\x1b[2m';
          if (currentFg) out += currentFg;
          if (currentBg) out += currentBg;
        }

        out += curCell.char;
        cursorX++;

        // Update previous frame cell cache
        prevCell.char = curCell.char;
        prevCell.fg = curCell.fg;
        prevCell.bg = curCell.bg;
        prevCell.bold = curCell.bold;
        prevCell.dim = curCell.dim;
      }
    }

    if (hasChanges) {
      out += RESET + SYNC_END;
      process.stdout.write(out);
    }

    this.forceFullRedraw = false;
    this.isDirty = false;
  }
}
