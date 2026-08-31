import React from 'react';
import { Box, Text } from 'ink';
import type { InvariantResult } from '@acid-test/core';
import { THEME, safeTruncate } from '../theme.js';

interface ExplorerProps {
  results: InvariantResult[];
  selectedIndex: number;
  isRunning: boolean;
  activeTestName?: string;
  width: number;
}

export const InvariantsExplorer: React.FC<ExplorerProps> = ({
  results,
  selectedIndex,
  isRunning,
  activeTestName,
  width,
}) => {
  const maxVisible = 14;
  const total = results.length;
  const contentWidth = Math.max(15, width - 2);
  const titleWidth = Math.max(6, contentWidth - 22);

  // Group into Failures First, then Passing
  const failures = results.filter((r) => r.status === 'FAIL');
  const passes = results.filter((r) => r.status !== 'FAIL');
  const groupedResults = [...failures, ...passes];

  // Compute scroll window
  let startIdx = 0;
  if (total > maxVisible) {
    startIdx = Math.max(0, Math.min(selectedIndex - 5, total - maxVisible));
  }
  const visibleResults = groupedResults.slice(startIdx, startIdx + maxVisible);

  return (
    <Box flexDirection="column" width={width} paddingRight={1}>
      {/* Explorer Header */}
      <Box justifyContent="space-between" width={contentWidth} flexWrap="nowrap">
        <Text bold color="white">
          INVARIANTS EXPLORER
        </Text>
        <Text color="gray">
          {failures.length > 0 ? (
            <Text>
              <Text color="red" bold>{failures.length} fail</Text>
              <Text color="gray"> • </Text>
              <Text color="green">{passes.length} pass</Text>
            </Text>
          ) : (
            <Text color="green">{total} passed</Text>
          )}
        </Text>
      </Box>

      {total === 0 ? (
        <Box paddingY={1}>
          <Text color="gray">
            {isRunning ? `Running ${safeTruncate(activeTestName, titleWidth)}...` : 'No invariants loaded.'}
          </Text>
        </Box>
      ) : (
        <Box flexDirection="column" marginTop={0}>
          {visibleResults.map((r, relIdx) => {
            const actualIdx = startIdx + relIdx;
            const isSelected = actualIdx === selectedIndex;
            const isPass = r.status === 'PASS';
            const isFail = r.status === 'FAIL';
            const statusColor = isPass ? 'green' : isFail ? 'red' : 'yellow';
            const statusIcon = isPass ? THEME.symbols.pass : isFail ? THEME.symbols.fail : THEME.symbols.warn;

            const shortId = r.testId.replace(/^ACID-/, '').padEnd(8, ' ').slice(0, 8);
            const truncatedTitle = safeTruncate(r.title || r.testName, titleWidth).padEnd(titleWidth, ' ');

            // Section divider if transitioning between failures and passes
            const isFirstPass = isPass && relIdx > 0 && visibleResults[relIdx - 1]?.status === 'FAIL';

            return (
              <React.Fragment key={r.testId}>
                {isFirstPass && (
                  <Box width={contentWidth} marginTop={0} marginBottom={0}>
                    <Text color="gray">
                      {THEME.symbols.rule.repeat(Math.max(4, contentWidth))}
                    </Text>
                  </Box>
                )}
                <Box
                  justifyContent="space-between"
                  width={contentWidth}
                  backgroundColor={isSelected ? 'cyan' : undefined}
                  flexWrap="nowrap"
                >
                  <Box gap={1} flexWrap="nowrap">
                    <Text color={isSelected ? 'black' : isFail ? 'red' : 'cyan'} bold={isSelected || isFail}>
                      {isSelected ? THEME.symbols.pointer : ' '} {shortId}
                    </Text>
                    <Text color={isSelected ? 'black' : isFail ? 'white' : 'gray'} bold={isSelected || isFail}>
                      {truncatedTitle}
                    </Text>
                  </Box>

                  <Box gap={1} flexWrap="nowrap">
                    <Text color={isSelected ? 'black' : statusColor} bold>
                      {statusIcon}
                    </Text>
                    <Text color={isSelected ? 'black' : 'gray'}>
                      {`${r.durationMs}ms`.padStart(5, ' ')}
                    </Text>
                  </Box>
                </Box>
              </React.Fragment>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
