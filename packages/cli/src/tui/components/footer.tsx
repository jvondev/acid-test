import React from 'react';
import { Box, Text } from 'ink';
import { THEME, safeTruncate } from '../theme.js';

interface FooterProps {
  isRunning: boolean;
  statusMessage?: string;
  activeTestName?: string;
  selectedSummary?: string;
  columns: number;
}

export const FooterDock: React.FC<FooterProps> = ({
  isRunning,
  statusMessage,
  activeTestName,
  selectedSummary,
  columns,
}) => {
  const isCompact = columns < 100;

  // Build clean non-wrapping shortcuts strip with mouse hint
  const shortcuts = isCompact
    ? 'Click / ↑↓ Select • Enter/F Fix • Space Run • V Scorecard • Q Exit'
    : 'Click / 1-9 Tabs • ↑/↓ Move • Enter/F Fix • Space Run • V Scorecard • C Chaos • Q Exit';

  const statusText = isRunning
    ? `Running ${safeTruncate(activeTestName || 'tests', 16)}...`
    : (statusMessage || '● Ready');

  const maxShortcutsLen = Math.max(20, columns - statusText.length - 4);
  const displayShortcuts = safeTruncate(shortcuts, maxShortcutsLen);

  return (
    <Box flexDirection="column" width={columns} marginTop={0}>
      {/* Horizontal Rule */}
      <Box width={columns}>
        <Text color="gray">{THEME.symbols.rule.repeat(Math.max(10, columns))}</Text>
      </Box>

      {/* Row 1: Selected Invariant Human Summary (Zero Emoji) */}
      {selectedSummary && (
        <Box width={columns} marginBottom={0} flexWrap="nowrap">
          <Text color="cyan" bold>[Summary] </Text>
          <Text color="gray">{safeTruncate(selectedSummary, columns - 12)}</Text>
        </Box>
      )}

      {/* Row 2: Single Non-Wrapping Command Dock */}
      <Box justifyContent="space-between" width={columns} flexWrap="nowrap">
        <Text color="cyan" bold>
          {displayShortcuts}
        </Text>
        <Text color={isRunning ? 'yellow' : 'green'}>
          {safeTruncate(statusText, 28)}
        </Text>
      </Box>
    </Box>
  );
};
