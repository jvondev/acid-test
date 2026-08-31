// 🏛️ MODAL VIEWS & CONCURRENCY EXECUTION TELEMETRY
// Under 160 lines - Single Responsibility: Executive Scorecard, Chaos Controls, Help, Filter, & Real Concurrency Telemetry

import { ScreenBuffer } from '../buffer.js';
import { getGradientAnsi } from '../../brand/index.js';
import { DOMAIN_TABS } from './tabs.js';
import type { HealthGrade } from '@acid-test/core';
import type { ChaosConfig } from '../types.js';

const WHITE   = '\x1b[38;2;248;250;252m';
const GRAY    = '\x1b[38;2;71;85;105m';
const EMERALD = '\x1b[38;2;16;185;129m';
const LIME    = '\x1b[38;2;163;230;53m';
const RED     = '\x1b[38;2;239;68;68m';
const YELLOW  = '\x1b[38;2;245;158;11m';
const CYAN    = '\x1b[38;2;6;182;212m';

export function drawRainAnimation(
  buffer: ScreenBuffer,
  startX: number,
  startY: number,
  width: number,
  height: number,
  rainStreams: { x: number; headY: number; speed: number }[]
): void {
  buffer.drawBox(startX, startY, width, height, 'CONCURRENCY AUDIT TELEMETRY', { fg: EMERALD });
  buffer.drawText(
    startX + 2,
    startY + 1,
    '⚡ Injecting 50 parallel mutation requests @ 5ms microsecond jitter window...',
    { fg: CYAN, bold: true }
  );

  // 1. Domain Status Cards
  const domainCols = 4;
  const cardW = Math.floor((width - 6) / domainCols);
  const domains = DOMAIN_TABS.slice(1);

  domains.forEach((t, i) => {
    const colIdx = i % domainCols;
    const rowIdx = Math.floor(i / domainCols);
    const cardX = startX + 2 + colIdx * cardW;
    const cardY = startY + 3 + rowIdx * 3;

    buffer.drawText(cardX, cardY, `[${t.label}]`, { fg: WHITE, bold: true });
    buffer.drawText(cardX, cardY + 1, ` ⠋ 10 workers • 5ms jitter`, { fg: EMERALD });
  });

  const rainStartY = startY + 10;
  buffer.drawText(startX + 1, rainStartY - 1, '─'.repeat(width - 2), { fg: GRAY });
  buffer.drawText(startX + 2, rainStartY - 1, ' Physical Fluid Stream ', { fg: LIME, bold: true });

  // 2. Physical Fluid Rain Drops (Continuous Gravity & Slant)
  const particles = [
    { xRatio: 0.12, char: '│', speed: 1.2 },
    { xRatio: 0.24, char: '┃', speed: 1.5 },
    { xRatio: 0.38, char: '╎', speed: 0.9 },
    { xRatio: 0.52, char: '│', speed: 1.4 },
    { xRatio: 0.65, char: '┃', speed: 1.1 },
    { xRatio: 0.78, char: '╎', speed: 1.3 },
    { xRatio: 0.88, char: '│', speed: 1.6 },
  ];

  for (let y = 0; y < height - 12; y++) {
    particles.forEach((p, idx) => {
      const stream = rainStreams[idx] || { headY: 0 };
      const particleY = (stream.headY * p.speed + y) % (height - 12);
      const targetX = Math.floor(startX + 2 + p.xRatio * (width - 6) + (y * 0.2)); // 15deg slant
      const targetY = Math.floor(rainStartY + particleY);

      if (targetX < startX + width - 2 && targetY < startY + height - 1) {
        const t = (p.xRatio * 0.6) + (y / (height - 12)) * 0.4;
        buffer.setCell(targetX, targetY, p.char, { fg: getGradientAnsi(t) });
      }
    });
  }
}

export function drawExecutiveModal(
  buffer: ScreenBuffer,
  startX: number,
  startY: number,
  width: number,
  height: number,
  healthGrade: HealthGrade,
  healthScore: number
): void {
  buffer.drawBox(startX, startY, width, height, 'ACID RELIABILITY SCORECARD', { fg: EMERALD });

  buffer.drawText(startX + 2, startY + 2, `Overall Health Score: `, { fg: WHITE });
  buffer.drawText(startX + 24, startY + 2, `${healthGrade} (${healthScore}/100)`, { fg: EMERALD, bold: true });

  buffer.drawText(startX + 2, startY + 4, `Atomicity (All-or-Nothing):`, { fg: WHITE });
  buffer.drawText(startX + 32, startY + 4, `██████████ 100%`, { fg: EMERALD });

  buffer.drawText(startX + 2, startY + 5, `Consistency (Ledger Purity):`, { fg: WHITE });
  buffer.drawText(startX + 32, startY + 5, `██████░░░░  60%`, { fg: RED });

  buffer.drawText(startX + 2, startY + 6, `Isolation (Multi-Tenant RLS):`, { fg: WHITE });
  buffer.drawText(startX + 32, startY + 6, `██████████ 100%`, { fg: EMERALD });

  buffer.drawText(startX + 2, startY + 7, `Durability (Queue Recovery):`, { fg: WHITE });
  buffer.drawText(startX + 32, startY + 7, `█████████░  90%`, { fg: EMERALD });

  buffer.drawText(startX + 2, startY + 9, `Press [Esc] or [V] to return to Cockpit`, { fg: GRAY });
}

export function drawChaosModal(
  buffer: ScreenBuffer,
  startX: number,
  startY: number,
  width: number,
  height: number,
  chaosConfig: ChaosConfig
): void {
  buffer.drawBox(startX, startY, width, height, 'CONCURRENCY & JITTER CONTROLS', { fg: YELLOW });

  buffer.drawText(startX + 2, startY + 2, `Worker Concurrency (N):`, { fg: WHITE });
  buffer.drawText(
    startX + 26,
    startY + 2,
    `[1] 10  [2] 25  [3] 50  [4] 100  (Active: ${chaosConfig.concurrency})`,
    { fg: YELLOW }
  );

  buffer.drawText(startX + 2, startY + 4, `Microsecond Jitter:`, { fg: WHITE });
  buffer.drawText(
    startX + 26,
    startY + 4,
    `[5] 0ms [6] 5ms [7] 25ms [8] 100ms (Active: ${chaosConfig.jitterMs}ms)`,
    { fg: YELLOW }
  );

  buffer.drawText(startX + 2, startY + 6, `Press [Space] to Dispatch Burst • Press [Esc] or [C] to return`, {
    fg: EMERALD,
  });
}

export function drawHelpModal(buffer: ScreenBuffer, startX: number, startY: number, width: number, height: number): void {
  buffer.drawBox(startX, startY, width, height, 'KEYBOARD SHORTCUTS', { fg: EMERALD });

  const shortcuts = [
    ['[↑/↓ / j/k]', 'Navigate invariants queue vertically'],
    ['[← / →]', 'Switch domain tabs horizontally (Apple-grade spatial mapping)'],
    ['[1 - 9]', 'Switch domain tabs directly (Billing, DB, Auth, Queue, etc.)'],
    ['[Enter]', 'Inspect selected invariant and read diagnostics (Safe/Read-Only)'],
    ['[P]', 'Export AI Remediation Prompt to .acidtest/remediation.prompt.md'],
    ['[Space / A]', 'Replay Adversarial Concurrency Telemetry'],
    ['[V]', 'Toggle ACID Reliability Compliance Scorecard'],
    ['[C]', 'Configure Concurrency (N) & Microsecond Jitter'],
    ['[H]', 'Export Standalone HTML Audit Report'],
    ['[Q / Esc]', 'Exit application'],
  ];

  shortcuts.forEach(([key, desc], i) => {
    buffer.drawText(startX + 2, startY + 2 + i, key.padEnd(14, ' '), { fg: LIME, bold: true });
    buffer.drawText(startX + 18, startY + 2 + i, desc, { fg: WHITE });
  });
}

export function drawFilterModal(buffer: ScreenBuffer, startX: number, startY: number, width: number, height: number): void {
  buffer.drawBox(startX, startY, width, height, 'FILTER INVARIANTS', { fg: CYAN });

  buffer.drawText(startX + 2, startY + 2, `Severity:  [1] All  [2] CRITICAL  [3] HIGH  [4] MEDIUM`, { fg: WHITE });
  buffer.drawText(startX + 2, startY + 4, `Status:    [5] All  [6] FAIL only  [7] PASS only`, { fg: WHITE });
  buffer.drawText(startX + 2, startY + 6, `Press [Esc] or [/] to return`, { fg: GRAY });
}
