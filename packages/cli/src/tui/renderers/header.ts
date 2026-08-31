// 🏛️ HEADER RENDERER (NO-SLOP, ZERO FAKE ANIMATION)
// Under 85 lines - Single Responsibility: Animated Droplet, Precision Wordmark, and Stable Metrics

import { ScreenBuffer } from '../buffer.js';
import {
  getGradientAnsi,
  BRAND_VERSION,
  BRAND_TAGLINE,
  DROPLET_ROWS,
  WORDMARK_ROWS,
} from '../../brand/index.js';

const WHITE   = '\x1b[38;2;248;250;252m';
const MUTED   = '\x1b[38;2;148;163;184m';
const GRAY    = '\x1b[38;2;71;85;105m';
const EMERALD = '\x1b[38;2;16;185;129m';
const RED     = '\x1b[38;2;239;68;68m';
const YELLOW  = '\x1b[38;2;245;158;11m';

export interface HeaderProps {
  targetUrl: string;
  targetLatencyMs: number;
  isSandbox: boolean;
  totalInvariants: number;
  passedInvariants: number;
  timeVal: number;
}

export function drawHeader(buffer: ScreenBuffer, startX: number, startY: number, props: HeaderProps): void {
  const { targetUrl, targetLatencyMs, isSandbox, totalInvariants, passedInvariants, timeVal } = props;
  const failedCount = totalInvariants - passedInvariants;
  const passRatio = totalInvariants > 0 ? passedInvariants / totalInvariants : 1.0;
  const passPct = Math.round(passRatio * 100);

  const barWidth = 14;
  const filledLen = Math.round(passRatio * barWidth);
  const emptyLen = Math.max(0, barWidth - filledLen);

  for (let y = 0; y < 6; y++) {
    const currentY = startY + y;

    // 1. Ambient Caustics Droplet
    const dropRaw = DROPLET_ROWS[y];
    Array.from(dropRaw).forEach((char, col) => {
      if (char !== ' ') {
        const caustic = Math.sin(timeVal * 3.0 + y * 1.5 + col * 0.8) * 0.08;
        const t = Math.max(0, Math.min(1, (col / 9) * 0.25 + caustic));
        buffer.setCell(startX + col, currentY, char, { fg: getGradientAnsi(t) });
      }
    });

    const textX = startX + 13;

    // 2. Wordmark & Status Rows
    if (y === 0) {
      const wmRaw = WORDMARK_ROWS[0];
      Array.from(wmRaw).forEach((c, col) => {
        if (c !== ' ') {
          const t = 0.3 + (col / wmRaw.length) * 0.7;
          buffer.setCell(textX + col, currentY, c, { fg: getGradientAnsi(t) });
        }
      });
      buffer.drawText(textX + wmRaw.length + 3, currentY, `v${BRAND_VERSION}`, { fg: GRAY });
    } else if (y === 1) {
      const wmRaw = WORDMARK_ROWS[1];
      Array.from(wmRaw).forEach((c, col) => {
        if (c !== ' ') {
          const t = 0.3 + (col / wmRaw.length) * 0.7;
          buffer.setCell(textX + col, currentY, c, { fg: getGradientAnsi(t) });
        }
      });
      const targetStr = isSandbox ? `${targetUrl} (sandbox)` : `${targetUrl} (${targetLatencyMs}ms)`;
      buffer.drawText(textX + wmRaw.length + 3, currentY, targetStr, { fg: isSandbox ? YELLOW : EMERALD });
    } else if (y === 2) {
      const ruleLen = Math.max(10, buffer.cols - textX - 4);
      buffer.drawText(textX, currentY, '─'.repeat(ruleLen), { fg: GRAY });
    } else if (y === 3) {
      buffer.drawText(textX, currentY, BRAND_TAGLINE, { fg: WHITE, bold: true });
    } else if (y === 4) {
      buffer.drawText(textX, currentY, `${totalInvariants} invariants audited  •  Status: `, { fg: MUTED });
      const barX = textX + 37;
      buffer.drawText(barX, currentY, '█'.repeat(filledLen), { fg: EMERALD, bold: true });
      buffer.drawText(barX + filledLen, currentY, '░'.repeat(emptyLen), { fg: GRAY });
      
      const statusColor = failedCount > 0 ? RED : EMERALD;
      const statusText = failedCount > 0 ? `${passPct}% (${passedInvariants}/${totalInvariants} passed • ${failedCount} fail)` : `100% (All ${totalInvariants} verified)`;
      buffer.drawText(barX + barWidth + 2, currentY, statusText, { fg: statusColor, bold: true });
    }
  }
}
