// 🏛️ ACIDTEST DEDICATED BRAND IDENTITY, LOGO & BANNER GENERATOR
// Zero-slop engineering precision: "Verify Atomicity, Consistency, Isolation & Durability."

import { getGradientAnsi, colorizeText } from './palette.js';

export const BRAND_NAME = 'acidtest';
export const BRAND_VERSION = '1.0.0';
export const BRAND_TAGLINE = 'Verify Atomicity, Consistency, Isolation & Durability.';

export const DROPLET_ROWS = [
  '    ▄    ',
  '   ███   ',
  '  █████  ',
  ' ███████ ',
  ' ███████ ',
  '  ▀███▀  ',
];

export const WORDMARK_ROWS = [
  '▄▀█ █▀▀ █ █▀▄ ▀█▀ █▀▀ █▀▀ ▀█▀',
  '█▀█ █▄▄ █ █▄▀  █  ██▄ ▄██  █ ',
];

export interface HeaderOptions {
  targetUrl?: string;
  latencyMs?: number;
  invariantsCount?: number;
  timeVal?: number;
  compact?: boolean;
}

/**
 * Generates the full 6-row solid half-block logo banner with optional live caustics.
 * Reusable across CLI startup commands and TUI headers.
 */
export function renderBrandBanner(options: HeaderOptions = {}): string {
  const {
    targetUrl = 'http://localhost:3000',
    latencyMs = 1.2,
    invariantsCount = 24,
    timeVal = 0,
    compact = false,
  } = options;

  if (compact) {
    const icon = colorizeText('◆', 0.2, 0.4);
    const name = colorizeText(BRAND_NAME, 0.4, 0.9);
    return `${icon} ${name} \x1b[90mv${BRAND_VERSION}\x1b[0m • \x1b[36m${targetUrl}\x1b[0m \x1b[90m(${latencyMs}ms)\x1b[0m`;
  }

  let out = '\n';

  for (let y = 0; y < 6; y++) {
    // 1. Solid Half-Block Droplet (Left)
    const dropRaw = DROPLET_ROWS[y];
    const coloredDrop = Array.from(dropRaw)
      .map((c, col) => {
        if (c === ' ') return ' ';
        const caustic = Math.sin(timeVal * 3.0 + y * 1.5 + col * 0.8) * 0.08;
        const t = Math.max(0, Math.min(1, (col / 9) * 0.25 + caustic));
        return `${getGradientAnsi(t)}${c}\x1b[0m`;
      })
      .join('');

    // 2. Right Side Text (Wordmark, Tagline, Separator)
    let rightContent = '';
    if (y === 0) {
      const wmRaw = WORDMARK_ROWS[0];
      rightContent =
        Array.from(wmRaw)
          .map((c, col) => {
            if (c === ' ') return ' ';
            const t = 0.3 + (col / wmRaw.length) * 0.7;
            return `${getGradientAnsi(t)}${c}\x1b[0m`;
          })
          .join('') + `   \x1b[90mv${BRAND_VERSION}\x1b[0m`;
    } else if (y === 1) {
      const wmRaw = WORDMARK_ROWS[1];
      rightContent =
        Array.from(wmRaw)
          .map((c, col) => {
            if (c === ' ') return ' ';
            const t = 0.3 + (col / wmRaw.length) * 0.7;
            return `${getGradientAnsi(t)}${c}\x1b[0m`;
          })
          .join('') + `   \x1b[32m${targetUrl}\x1b[0m`;
    } else if (y === 2) {
      rightContent = `\x1b[90m${'─'.repeat(58)}\x1b[0m`;
    } else if (y === 3) {
      rightContent = `\x1b[1m\x1b[37m${BRAND_TAGLINE}\x1b[0m`;
    } else if (y === 4) {
      rightContent = `\x1b[90m${invariantsCount} distributed invariants audited  •  \x1b[38;2;163;230;53m● ${latencyMs}ms latency\x1b[0m`;
    } else {
      rightContent = '';
    }

    out += `  ${coloredDrop}   ${rightContent}\n`;
  }

  out += `  \x1b[90m${'─'.repeat(74)}\x1b[0m\n`;
  return out;
}
