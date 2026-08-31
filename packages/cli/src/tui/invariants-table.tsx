import React from 'react';
import { Box, Text } from 'ink';
import type { InvariantResult } from '@acidtest/core';

interface InvariantsTableProps {
  results: InvariantResult[];
  selectedIndex: number;
  isRunning: boolean;
  activeTestName?: string;
  width?: number;
}

export const InvariantsTable: React.FC<InvariantsTableProps> = ({
  results,
  selectedIndex,
  isRunning,
  activeTestName,
  width = 65,
}) => {
  const titleWidth = Math.max(12, width - 36);

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1} width={width}>
      <Box justifyContent="space-between" flexWrap="nowrap">
        <Text bold color="cyan">INVARIANTS MATRIX</Text>
        <Text color="gray">{`Total: ${results.length} | ↑/↓ Select`}</Text>
      </Box>

      {results.length === 0 ? (
        <Box paddingY={1}>
          <Text color="gray">{isRunning ? `⚡ Fuzzing ${activeTestName || 'invariants'}...` : 'Press [A] to trigger full audit matrix.'}</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          {results.slice(0, 7).map((r, idx) => {
            const isSelected = idx === selectedIndex;
            const statusColor = r.status === 'PASS' ? 'green' : r.status === 'FAIL' ? 'red' : 'yellow';
            const statusIcon = r.status === 'PASS' ? '✔' : r.status === 'FAIL' ? '✖' : '⚠';

            const rawTitle = r.title || r.testName;
            const truncatedTitle = rawTitle.length > titleWidth
              ? `${rawTitle.slice(0, titleWidth - 1)}…`
              : rawTitle.padEnd(titleWidth, ' ');

            const shortId = r.testId.replace('ACID-', '');

            return (
              <Box key={r.testId} justifyContent="space-between" flexWrap="nowrap">
                <Box gap={1} flexWrap="nowrap">
                  <Text color={isSelected ? 'cyan' : 'white'} bold={isSelected}>
                    {isSelected ? '▶' : ' '} {shortId.padEnd(12, ' ')}
                  </Text>
                  <Text color={isSelected ? 'white' : 'gray'}>
                    {truncatedTitle}
                  </Text>
                </Box>

                <Box gap={1} flexWrap="nowrap">
                  <Text color={statusColor} bold>
                    {statusIcon} {r.status.padEnd(4, ' ')}
                  </Text>
                  <Text color="gray">{`${r.durationMs}ms`.padStart(6, ' ')}</Text>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
