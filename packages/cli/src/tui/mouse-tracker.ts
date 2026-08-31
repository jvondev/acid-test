// SGR 1006 Mouse Tracker for Terminal User Interfaces
// Enables mouse clicking on tabs, invariant list items, and action buttons in Windows Terminal & Unix

export interface MouseClickEvent {
  button: 'left' | 'right' | 'middle' | 'scrollUp' | 'scrollDown';
  x: number; // 1-indexed column
  y: number; // 1-indexed row
}

export class MouseTracker {
  private static enabled = false;

  static enable(): void {
    if (this.enabled || !process.stdout.isTTY) return;
    // Enable SGR mouse tracking (1000 = normal tracking, 1002 = button tracking, 1006 = SGR coordinates)
    process.stdout.write('\x1b[?1000h\x1b[?1002h\x1b[?1006h');
    this.enabled = true;
  }

  static disable(): void {
    if (!this.enabled || !process.stdout.isTTY) return;
    // Disable SGR mouse tracking cleanly
    process.stdout.write('\x1b[?1006l\x1b[?1002l\x1b[?1000l');
    this.enabled = false;
  }

  static parseMouseEvent(data: string): MouseClickEvent | null {
    // SGR format: \x1b[<btn;x;yM (press) or \x1b[<btn;x;ym (release)
    const match = data.match(/\x1b\[<(\d+);(\d+);(\d+)([Mm])/);
    if (!match) return null;

    const btnCode = parseInt(match[1], 10);
    const x = parseInt(match[2], 10);
    const y = parseInt(match[3], 10);
    const isPress = match[4] === 'M';

    if (!isPress) return null;

    let button: MouseClickEvent['button'] = 'left';
    if (btnCode === 0) button = 'left';
    else if (btnCode === 1) button = 'middle';
    else if (btnCode === 2) button = 'right';
    else if (btnCode === 64) button = 'scrollUp';
    else if (btnCode === 65) button = 'scrollDown';

    return { button, x, y };
  }
}
