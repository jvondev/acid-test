// 🖱️ SGR-1006 TERMINAL MOUSE PROTOCOL HANDLER
// Under 140 lines - Single Responsibility: Parsing SGR Extended Mouse Sequences & UI Hit-Testing

import type { RatatuiEngine } from './engine.js';
import { DOMAIN_TABS } from './renderers/tabs.js';

export interface MouseEvent {
  button: number; // 0: Left, 1: Middle, 2: Right, 64: WheelUp, 65: WheelDown
  x: number;      // 0-indexed column
  y: number;      // 0-indexed row
  isRelease: boolean;
}

export class MouseHandler {
  constructor(private engine: RatatuiEngine) {}

  /**
   * Parses SGR 1006 mouse sequence: \x1b[<Button;Col;RowM (down) or m (up)
   */
  public parseAndHandle(input: string): boolean {
    const sgrRegex = /\x1b\[<(\d+);(\d+);(\d+)([Mm])/g;
    let match: RegExpExecArray | null;
    let handled = false;

    while ((match = sgrRegex.exec(input)) !== null) {
      const button = parseInt(match[1], 10);
      const x = parseInt(match[2], 10) - 1; // Convert 1-indexed to 0-indexed
      const y = parseInt(match[3], 10) - 1;
      const isRelease = match[4] === 'm';

      this.handleMouseEvent({ button, x, y, isRelease });
      handled = true;
    }

    return handled;
  }

  public handleMouseEvent(event: MouseEvent): void {
    // 1. If in Opening Scene -> Any click skips to Cockpit
    if (this.engine.getViewState() === 'OPENING') {
      if (!event.isRelease && (event.button === 0 || event.button === 64 || event.button === 65)) {
        this.engine.skipOpeningToCockpit();
      }
      return;
    }

    // 2. Mouse Wheel Scroll (64 = Up, 65 = Down)
    if (event.button === 64) {
      // Scroll Up
      this.engine.setSelectedIndex(Math.max(0, this.engine.getSelectedIndex() - 1));
      return;
    }
    if (event.button === 65) {
      // Scroll Down
      const total = this.engine.getFilteredCount();
      this.engine.setSelectedIndex(Math.min(Math.max(0, total - 1), this.engine.getSelectedIndex() + 1));
      return;
    }

    // Only process primary left-click down
    if (event.isRelease || event.button !== 0) return;

    // 3. Tab Bar Click Hit-Testing (y = 8)
    if (event.y === 8) {
      let curX = 2;
      const counts = this.engine.getCounts();

      for (const tab of DOMAIN_TABS) {
        const count = counts[tab.id] || 0;
        const labelLen = ` [${tab.num}] ${tab.label}:${count} `.length;

        if (event.x >= curX && event.x < curX + labelLen) {
          this.engine.setCurrentTab(tab.id);
          this.engine.setSelectedIndex(0);
          this.engine.render();
          return;
        }
        curX += labelLen + 1;
      }
    }

    // 4. Invariants Left List Click Hit-Testing
    const listStartX = 2;
    const listWidth = Math.max(28, Math.floor((process.stdout.columns || 110) * 0.36));
    const listStartY = 10;
    const rows = process.stdout.rows || 32;
    const height = rows - listStartY - 2;
    const visibleRows = height - 2;

    if (event.x >= listStartX && event.x <= listStartX + listWidth && event.y > listStartY && event.y <= listStartY + visibleRows) {
      const clickedRowOffset = event.y - (listStartY + 1);
      const total = this.engine.getFilteredCount();
      const startIdx = Math.max(0, Math.min(this.engine.getSelectedIndex() - 4, Math.max(0, total - visibleRows)));
      const targetIdx = startIdx + clickedRowOffset;
      if (clickedRowOffset >= 0 && targetIdx >= 0 && targetIdx < total) {
        this.engine.setSelectedIndex(targetIdx);
        this.engine.render();
        return;
      }
    }

    // 5. Footer Buttons Click Hit-Testing (y >= rows - 2)
    if (event.y >= rows - 2) {
      const actions = [
        { label: ' [1-9] Tabs ', action: () => {} },
        { label: ' [↑/↓] Select ', action: () => {} },
        { label: ' [Enter] Inspect ', action: () => this.engine.showToast('Inspecting invariant') },
        { label: ' [P] AI Fix Prompt ', action: () => this.engine.triggerAiPromptExport() },
        { label: ' [Space] Burst ', action: () => this.engine.runAudit() },
        { label: ' [V] Scorecard ', action: () => this.engine.setActiveModal('executive') },
        { label: ' [C] Chaos ', action: () => this.engine.setActiveModal('chaos') },
        { label: ' [Q] Exit ', action: () => this.engine.stop() },
      ];

      let curX = 2;
      for (const act of actions) {
        const len = act.label.length;
        if (event.x >= curX && event.x < curX + len) {
          act.action();
          return;
        }
        curX += len + 1;
      }
    }
  }
}
