// 🏛️ OPENING SCENE: CINEMATIC FULLSCREEN GATE-OPENING WATERFALL
// Under 130 lines - Single Responsibility: Heavy Atmospheric Acid Rain & Live Audit Loading Gate

import { ScreenBuffer } from '../buffer.js';
import { HeavyRainEngine } from '../rain-engine.js';
import {
  getGradientAnsi,
  BRAND_TAGLINE,
  DROPLET_ROWS,
  WORDMARK_ROWS,
} from '../../brand/index.js';

const WHITE   = '\x1b[38;2;248;250;252m';
const MUTED   = '\x1b[38;2;148;163;184m';
const GRAY    = '\x1b[38;2;71;85;105m';
const EMERALD = '\x1b[38;2;16;185;129m';
const LIME    = '\x1b[38;2;163;230;53m';
const CYAN    = '\x1b[38;2;6;182;212m';

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
  const cardW = Math.min(cols - 8, 76);
  const cardH = 14;
  const cardX = Math.floor((cols - cardW) / 2);
  const cardY = Math.max(1, Math.floor((rows - cardH) / 2));

  // Solid background fill to separate foreground gate from atmospheric rain
  for (let y = cardY; y < cardY + cardH; y++) {
    for (let x = cardX; x < cardX + cardW; x++) {
      buffer.setCell(x, y, ' ', { bg: '\x1b[48;2;11;15;23m' });
    }
  }
  buffer.drawBox(cardX, cardY, cardW, cardH, 'ACIDTEST INITIALIZING GATE', { fg: EMERALD });

  // 3. Hero Droplet & Wordmark
  const heroX = cardX + 4;
  const heroY = cardY + 2;

  // Droplet
  for (let dy = 0; dy < 4; dy++) {
    const dropLine = DROPLET_ROWS[dy + 1];
    Array.from(dropLine).forEach((char, cx) => {
      if (char !== ' ') {
        const caustic = Math.sin(timeVal * 3.0 + dy * 1.5 + cx * 0.8) * 0.08;
        const t = Math.max(0, Math.min(1, (cx / 9) * 0.3 + caustic));
        buffer.setCell(heroX + cx, heroY + dy, char, { fg: getGradientAnsi(t), bg: '\x1b[48;2;11;15;23m' });
      }
    });
  }

  // Wordmark
  const wmX = heroX + 12;
  WORDMARK_ROWS.forEach((wmLine, wmy) => {
    Array.from(wmLine).forEach((char, wmx) => {
      if (char !== ' ') {
        const t = 0.3 + (wmx / wmLine.length) * 0.7;
        buffer.setCell(wmX + wmx, heroY + wmy, char, { fg: getGradientAnsi(t), bg: '\x1b[48;2;11;15;23m' });
      }
    });
  });

  // Tagline & Target
  buffer.drawText(wmX, heroY + 2, BRAND_TAGLINE, { fg: WHITE, bold: true, bg: '\x1b[48;2;11;15;23m' });
  buffer.drawText(wmX, heroY + 3, `Target: ${targetUrl} • 50 Parallel Workers`, { fg: CYAN, bg: '\x1b[48;2;11;15;23m' });

  // 4. Smooth Rain Progress Bar
  const progY = cardY + 8;
  const progW = cardW - 8;
  const pct = Math.round(progressRatio * 100);
  const filled = Math.round(progressRatio * progW);
  const empty = Math.max(0, progW - filled);

  buffer.drawText(cardX + 4, progY, `Auditing: `, { fg: MUTED, bg: '\x1b[48;2;11;15;23m' });
  buffer.drawText(cardX + 14, progY, (activeDomainName || 'Distributed Invariant Matrix').padEnd(30, ' '), {
    fg: LIME,
    bold: true,
    bg: '\x1b[48;2;11;15;23m',
  });
  buffer.drawText(cardX + cardW - 14, progY, `${pct}% complete`.padStart(10, ' '), {
    fg: EMERALD,
    bold: true,
    bg: '\x1b[48;2;11;15;23m',
  });

  // Progress Bar Strip
  const barY = progY + 2;
  buffer.drawText(cardX + 4, barY, '█'.repeat(filled), { fg: EMERALD, bg: '\x1b[48;2;11;15;23m' });
  buffer.drawText(cardX + 4 + filled, barY, '░'.repeat(empty), { fg: GRAY, bg: '\x1b[48;2;11;15;23m' });

  // Bottom Status
  buffer.drawText(
    cardX + 4,
    cardY + cardH - 2,
    `⚡ Running adversarial concurrency stress testing...`,
    { fg: MUTED, bg: '\x1b[48;2;11;15;23m' }
  );
}
