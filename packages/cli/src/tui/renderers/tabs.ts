// 🏛️ TABS BAR RENDERER
// Under 60 lines - Single Responsibility: Domain Navigation Filter Bar

import { ScreenBuffer } from '../buffer.js';
import type { TuiTab } from '../types.js';

const BG_GREEN = '\x1b[48;2;16;185;129m';
const BG_DARK  = '\x1b[48;2;11;15;23m';
const GRAY     = '\x1b[38;2;71;85;105m';

export const DOMAIN_TABS: { id: TuiTab; label: string; num: string }[] = [
  { id: 'overview', label: 'All', num: '1' },
  { id: 'billing', label: 'Billing', num: '2' },
  { id: 'db', label: 'DB', num: '3' },
  { id: 'auth', label: 'Auth', num: '4' },
  { id: 'queue', label: 'Queue', num: '5' },
  { id: 'webhook', label: 'Webhooks', num: '6' },
  { id: 'ai', label: 'AI', num: '7' },
  { id: 'email', label: 'Email', num: '8' },
  { id: 'storage', label: 'Storage', num: '9' },
];

export function drawTabs(
  buffer: ScreenBuffer,
  startX: number,
  startY: number,
  currentTab: TuiTab,
  counts: Record<TuiTab, number>
): void {
  let curX = startX;

  DOMAIN_TABS.forEach((tab) => {
    const isActive = tab.id === currentTab;
    const count = counts[tab.id] || 0;
    const label = ` [${tab.num}] ${tab.label}:${count} `;

    if (isActive) {
      buffer.drawText(curX, startY, label, { fg: BG_DARK, bg: BG_GREEN, bold: true });
    } else {
      buffer.drawText(curX, startY, label, { fg: GRAY });
    }
    curX += label.length + 1;
  });

  const ruleLen = Math.max(10, buffer.cols - startX * 2);
  buffer.drawText(startX, startY + 1, '─'.repeat(ruleLen), { fg: GRAY });
}
