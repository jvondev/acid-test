// 🏛️ FOOTER COMMAND DOCK RENDERER
// Under 50 lines - Single Responsibility: Bottom Action Shortcuts Dock

import { ScreenBuffer } from '../buffer.js';

const WHITE        = '\x1b[38;2;248;250;252m';
const GRAY         = '\x1b[38;2;71;85;105m';
const BG_GREEN     = '\x1b[48;2;16;185;129m';
const BG_DARK      = '\x1b[48;2;11;15;23m';
const BG_CYAN      = '\x1b[48;2;6;182;212m';
const BG_SELECTION = '\x1b[48;2;30;41;59m';

export function drawFooter(buffer: ScreenBuffer, startX: number, startY: number): void {
  const ruleLen = Math.max(10, buffer.cols - startX * 2);
  buffer.drawText(startX, startY, '─'.repeat(ruleLen), { fg: GRAY });

  let curX = startX;
  const actions = [
    { text: ' [1-9] Tabs ', style: { fg: BG_DARK, bg: BG_GREEN, bold: true } },
    { text: ' [↑/↓] Select ', style: { fg: WHITE, bg: BG_SELECTION } },
    { text: ' [Enter] Inspect ', style: { fg: WHITE, bg: BG_SELECTION } },
    { text: ' [P] AI Fix Prompt ', style: { fg: BG_DARK, bg: BG_GREEN, bold: true } },
    { text: ' [Space] Burst ', style: { fg: BG_DARK, bg: BG_CYAN, bold: true } },
    { text: ' [V] Scorecard ', style: { fg: WHITE, bg: BG_SELECTION } },
    { text: ' [C] Chaos ', style: { fg: WHITE, bg: BG_SELECTION } },
    { text: ' [Q] Exit ', style: { fg: GRAY } },
  ];

  actions.forEach((act) => {
    buffer.drawText(curX, startY + 1, act.text, act.style);
    curX += act.text.length + 1;
  });
}
