// Emil-grade typography, formatting, and layout tokens for Acid-test TUI
// Engineered for zero cognitive overload, high contrast, and dark terminal aesthetic

export * from '../brand/index.js';

export const THEME = {
  symbols: {
    pass: '✔',
    fail: '✖',
    warn: '▲',
    skip: '○',
    pointer: '❯',
    pulse: '⚡',
    barFilled: '█',
    barEmpty: '░',
    divider: '•',
    rule: '─',
    vertical: '│',
    plus: '+',
    minus: '-',
    cornerTL: '╭',
    cornerTR: '╮',
    cornerBL: '╰',
    cornerBR: '╯',
  },
} as const;

export function safeTruncate(str: string | undefined | null, maxWidth: number): string {
  if (!str) return '';
  if (maxWidth <= 0) return '';
  if (maxWidth <= 3) return str.slice(0, maxWidth);
  if (str.length <= maxWidth) return str;
  return `${str.slice(0, maxWidth - 1)}…`;
}

export function padEndSafe(str: string, targetLen: number): string {
  if (str.length >= targetLen) return str.slice(0, targetLen);
  return str + ' '.repeat(targetLen - str.length);
}

export function formatMoney(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

export function formatMs(ms: number): string {
  if (ms < 1) return `${Math.round(ms * 1000)}μs`;
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function renderBar(completed: number, total: number, width: number = 10): string {
  if (total <= 0) return THEME.symbols.barEmpty.repeat(width);
  const ratio = Math.max(0, Math.min(1, completed / total));
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  return `${THEME.symbols.barFilled.repeat(filled)}${THEME.symbols.barEmpty.repeat(empty)}`;
}

export function getHealthColor(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 80) return 'green';
  if (score >= 50) return 'yellow';
  return 'red';
}
