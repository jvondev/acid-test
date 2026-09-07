// 🏛️ SPLIT-SCREEN IDE RENDERER (INVARIANTS & CODE INSPECTOR)
// Under 160 lines - Single Responsibility: Dual-Pane Invariant Explorer & Wrapped Code Diff Viewer

import { ScreenBuffer } from '../buffer.js';
import type { InvariantResult } from '@acid-test/core';
import { getCodeDiffForInvariant } from '../code-diff-generator.js';

const WHITE        = '\x1b[38;2;248;250;252m';
const MUTED        = '\x1b[38;2;148;163;184m';
const GRAY         = '\x1b[38;2;71;85;105m';
const EMERALD      = '\x1b[38;2;16;185;129m';
const RED          = '\x1b[38;2;239;68;68m';
const CYAN         = '\x1b[38;2;6;182;212m';
const BG_GREEN     = '\x1b[48;2;16;185;129m';
const BG_DARK      = '\x1b[48;2;11;15;23m';
const BG_RED       = '\x1b[48;2;239;68;68m';
const BG_CYAN      = '\x1b[48;2;6;182;212m';
const BG_SELECTION = '\x1b[48;2;30;41;59m';

export interface SplitIdeProps {
  filteredResults: InvariantResult[];
  selectedIndex: number;
  isPromptExporting: boolean;
  promptExportStep: number;
}

export function drawSplitIde(
  buffer: ScreenBuffer,
  startX: number,
  startY: number,
  width: number,
  height: number,
  props: SplitIdeProps
): void {
  const { filteredResults, selectedIndex, isPromptExporting, promptExportStep } = props;
  const selected = filteredResults[selectedIndex] || filteredResults[0];

  const leftWidth = Math.max(28, Math.floor(width * 0.36));
  const rightX = startX + leftWidth + 2;
  const rightWidth = width - leftWidth - 2;

  // 1. Draw Left Invariants Explorer Box
  const failCount = filteredResults.filter((r) => r.status === 'FAIL').length;
  const passCount = filteredResults.filter((r) => r.status === 'PASS').length;
  const explorerTitle = `INVARIANTS (${failCount} fail • ${passCount} pass)`;
  buffer.drawBox(startX, startY, leftWidth, height, explorerTitle, { fg: GRAY });

  const visibleRows = height - 2;
  const startIdx = Math.max(0, Math.min(selectedIndex - 4, Math.max(0, filteredResults.length - visibleRows)));
  const slice = filteredResults.slice(startIdx, startIdx + visibleRows);

  slice.forEach((item, idx) => {
    const itemY = startY + 1 + idx;
    const actualIdx = startIdx + idx;
    const isSelected = actualIdx === selectedIndex;
    const isFail = item.status === 'FAIL';
    const shortId = item.testId.replace(/^ACID-/, '').slice(0, 7);
    const title = (item.title || item.testName).slice(0, leftWidth - 17);

    if (isSelected) {
      buffer.drawText(startX + 1, itemY, ' '.repeat(leftWidth - 2), { bg: BG_GREEN });
      buffer.drawText(startX + 1, itemY, ` ❯ ${shortId} ${title}`, { fg: BG_DARK, bg: BG_GREEN, bold: true });
      buffer.drawText(startX + leftWidth - 8, itemY, `${item.durationMs}ms`, { fg: BG_DARK, bg: BG_GREEN });
    } else {
      const color = isFail ? RED : WHITE;
      const icon = isFail ? '✖' : '✔';
      const iconColor = isFail ? RED : EMERALD;

      buffer.drawText(startX + 2, itemY, shortId, { fg: color, bold: isFail });
      buffer.drawText(startX + 10, itemY, title, { fg: MUTED });
      buffer.drawText(startX + leftWidth - 3, itemY, icon, { fg: iconColor, bold: true });
    }
  });

  // 2. Draw Right Diagnostic / Code Diff Box
  buffer.drawBox(rightX, startY, rightWidth, height, 'INSPECTOR', { fg: GRAY });

  if (selected) {
    const isFailed = selected.status === 'FAIL';
    const diff = getCodeDiffForInvariant(selected);

    // Header row
    const statusBadge = isFailed ? ' FAIL ' : ' VERIFIED ';
    const statusBg = isFailed ? BG_RED : BG_GREEN;
    buffer.drawText(rightX + 2, startY + 1, statusBadge, { fg: WHITE, bg: statusBg, bold: true });
    buffer.drawText(rightX + 11, startY + 1, (selected.title || selected.testName).slice(0, rightWidth - 24), {
      fg: WHITE,
      bold: true,
    });

    // File path row
    buffer.drawText(rightX + 2, startY + 2, `File: ${diff.file}:${selected.lineNumber || 33}`, { fg: CYAN });
    buffer.drawText(rightX + rightWidth - 12, startY + 2, `${selected.durationMs}ms`, { fg: MUTED });

    // Divider rule
    buffer.drawText(rightX + 1, startY + 3, '─'.repeat(rightWidth - 2), { fg: GRAY });

    // Multi-line Wrapped Code Diff
    let diffY = startY + 4;
    const maxCodeWidth = rightWidth - 10;

    diff.lines.forEach((dl) => {
      if (diffY >= startY + height - 4) return;

      const isAdd = dl.type === 'add';
      const isRemove = dl.type === 'remove';
      const lineNum = String(dl.lineNum).padStart(3, ' ');
      const textColor = isAdd ? EMERALD : isRemove ? RED : GRAY;
      const sign = isAdd ? '+' : isRemove ? '-' : '│';

      const codeStr = dl.code;

      if (codeStr.length <= maxCodeWidth) {
        buffer.drawText(rightX + 2, diffY, `${lineNum} ${sign}  ${codeStr}`, { fg: textColor, bold: isAdd || isRemove });
        diffY++;
      } else {
        const firstChunk = codeStr.slice(0, maxCodeWidth);
        const secondChunk = codeStr.slice(maxCodeWidth, maxCodeWidth * 2);

        buffer.drawText(rightX + 2, diffY, `${lineNum} ${sign}  ${firstChunk}`, { fg: textColor, bold: isAdd || isRemove });
        diffY++;

        if (diffY < startY + height - 4) {
          buffer.drawText(rightX + 2, diffY, `    │    ${secondChunk}`, { fg: textColor, bold: isAdd || isRemove });
          diffY++;
        }
      }
    });

    // Remediation note
    const remY = startY + height - 3;
    if (selected.suggestedFix) {
      buffer.drawText(rightX + 2, remY, `Remediation: ${selected.suggestedFix}`, { fg: EMERALD }, rightWidth - 4);
    }

    // Safe Action bar (AI Prompt Export)
    const actY = startY + height - 2;
    if (isPromptExporting) {
      const morphText =
        promptExportStep === 1
          ? '1. Analyzing AST defect...'
          : promptExportStep === 2
          ? '2. Synthesizing safe patch...'
          : '3. Exported to .acid-test/remediation.prompt.md';
      buffer.drawText(rightX + 2, actY, ` [⠋ AI PROMPT] `, { fg: BG_DARK, bg: BG_CYAN, bold: true });
      buffer.drawText(rightX + 18, actY, morphText, { fg: CYAN });
    } else {
      buffer.drawText(rightX + 2, actY, ` [P] AI Prompt Fix `, { fg: BG_DARK, bg: BG_GREEN, bold: true });
      buffer.drawText(rightX + 23, actY, ` [Enter] Inspect `, { fg: WHITE, bg: BG_SELECTION });
      buffer.drawText(rightX + 42, actY, ` [R] Replay `, { fg: WHITE, bg: BG_SELECTION });
    }
  }
}
