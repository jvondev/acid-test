// 🏛️ OPENING SCENE: CINEMATIC FULLSCREEN GATE-OPENING WATERFALL
// Single Responsibility: Heavy Atmospheric Acid Rain & Live Audit Loading Gate (Zero Clipping)

import { ScreenBuffer } from '../buffer.js';
import { HeavyRainEngine } from '../rain-engine.js';
import {
  getGradientAnsi,
  BRAND_TAGLINE,
  BRAND_VERSION,
  DROPLET_ROWS,
  WORDMARK_ROWS,
} from '../../brand/index.js';

const WHITE   = '\x1b[38;2;248;250;252m';
const MUTED   = '\x1b[38;2;148;163;184m';
const GRAY    = '\x1b[38;2;71;85;105m';
const EMERALD = '\x1b[38;2;16;185;129m';
const LIME    = '\x1b[38;2;163;230;53m';
const CYAN    = '\x1b[38;2;6;182;212m';
const BG_CARD = '\x1b[48;2;11;15;23m';

export interface OpeningSceneProps {
  progressRatio: number; // 0.0 to 1.0
  activeDomainName?: string;
  targetUrl: string;
  timeVal: number;
  rainEngine: HeavyRainEngine;
}

export function drawOpeningScene(buffer: ScreenBuffer, props: OpeningSceneProps): void {
  const { progressRatio, activeDomainName, targetUrl, timeVal, rainEngine } = props;
  const cols = buffer.cols;
  const rows = buffer.rows;

  // 1. Fullscreen Atmospheric Heavy Acid Rain
  rainEngine.render(buffer);

  // 2. Centered Floating Gate Card
  const cardW = Math.min(cols - 4, 80);
  const cardH = 16;
  const cardX = Math.floor((cols - cardW) / 2);
  const cardY = Math.max(1, Math.floor((rows - cardH) / 2));

  // Solid background fill to isolate foreground gate from atmospheric rain
  for (let y = cardY; y < cardY + cardH; y++) {
    for (let x = cardX; x < cardX + cardW; x++) {
      buffer.setCell(x, y, ' ', { bg: BG_CARD });
    }
  }
  buffer.drawBox(cardX, cardY, cardW, cardH, 'ACID-TEST INITIALIZING GATE', {
    fg: EMERALD,
    bg: BG_CARD,
  });

  // 3. Hero Droplet & Wordmark Section
  const heroX = cardX + 3;
  const heroY = cardY + 2;

  // Droplet: Full 6-row solid half-block geometry (Zero Clipping Guaranteed)
  for (let dy = 0; dy < DROPLET_ROWS.length; dy++) {
    const dropLine = DROPLET_ROWS[dy];
    Array.from(dropLine).forEach((char, cx) => {
      if (char !== ' ') {
        const caustic = Math.sin(timeVal * 3.0 + dy * 1.5 + cx * 0.8) * 0.08;
        const t = Math.max(0, Math.min(1, (cx / 9) * 0.35 + (dy / 6) * 0.2 + caustic));
        buffer.setCell(heroX + cx, heroY + dy, char, {
          fg: getGradientAnsi(t),
          bg: BG_CARD,
          bold: dy >= 1 && dy <= 4,
        });
      }
    });
  }

  // Wordmark & Tagline on the right of the droplet
  const wmX = heroX + 11;
  WORDMARK_ROWS.forEach((wmLine, wmy) => {
    Array.from(wmLine).forEach((char, wmx) => {
      if (char !== ' ') {
        const t = 0.3 + (wmx / wmLine.length) * 0.7;
        buffer.setCell(wmX + wmx, heroY + wmy, char, { fg: getGradientAnsi(t), bg: BG_CARD });
      }
    });
  });
  buffer.drawText(wmX + WORDMARK_ROWS[0].length + 3, heroY, `v${BRAND_VERSION}`, {
    fg: GRAY,
    bg: BG_CARD,
  });

  // Subdued divider on right side only
  const rightRuleLen = Math.max(10, cardW - (wmX - cardX) - 4);
  buffer.drawText(wmX, heroY + 2, '─'.repeat(rightRuleLen), { fg: GRAY, bg: BG_CARD });

  // Tagline & Target Details
  buffer.drawText(wmX, heroY + 3, BRAND_TAGLINE, { fg: WHITE, bold: true, bg: BG_CARD }, rightRuleLen);
  buffer.drawText(
    wmX,
    heroY + 4,
    `Target: ${targetUrl} • 50 Parallel Workers`,
    { fg: CYAN, bg: BG_CARD },
    rightRuleLen
  );

  // Full-width separator below hero section (Row 8 - below droplet row 5)
  buffer.drawText(cardX + 2, cardY + 8, '─'.repeat(cardW - 4), { fg: GRAY, bg: BG_CARD });

  // 4. Real-Time Audit Progress Section
  const progY = cardY + 9;
  const progW = cardW - 6;
  const clampedProgress = Math.max(0, Math.min(1, progressRatio));
  const pct = Math.round(clampedProgress * 100);
  const filled = Math.min(progW, Math.round(clampedProgress * progW));
  const empty = Math.max(0, progW - filled);

  buffer.drawText(cardX + 3, progY, `Auditing: `, { fg: MUTED, bg: BG_CARD });
  const maxDomainLen = cardW - 32;
  const domainText = (activeDomainName || 'Distributed Invariant Matrix').slice(0, maxDomainLen);
  buffer.drawText(cardX + 13, progY, domainText, {
    fg: LIME,
    bold: true,
    bg: BG_CARD,
  });
  buffer.drawText(cardX + cardW - 17, progY, `${pct}% complete`.padStart(13, ' '), {
    fg: EMERALD,
    bold: true,
    bg: BG_CARD,
  });

  // Progress Bar Strip
  const barY = cardY + 11;
  buffer.drawText(cardX + 3, barY, '█'.repeat(filled), { fg: EMERALD, bg: BG_CARD });
  buffer.drawText(cardX + 3 + filled, barY, '░'.repeat(empty), { fg: GRAY, bg: BG_CARD });

  // Bottom Status & Skip Hint
  buffer.drawText(
    cardX + 3,
    cardY + cardH - 2,
    `⚡ Adversarial concurrency testing active...`,
    { fg: MUTED, bg: BG_CARD },
    cardW - 28
  );
  buffer.drawText(
    cardX + cardW - 24,
    cardY + cardH - 2,
    `[Enter/Space: Skip]`,
    { fg: GRAY, bg: BG_CARD }
  );
}
