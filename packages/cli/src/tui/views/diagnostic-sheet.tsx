import React from 'react';
import { Box, Text } from 'ink';
import type { InvariantResult } from '@acidtest/core';
import { THEME, safeTruncate } from '../theme.js';
import { getCodeDiffForInvariant } from '../code-diff-generator.js';

interface DiagnosticSheetProps {
  result?: InvariantResult;
  columns: number;
}

export const DiagnosticSheet: React.FC<DiagnosticSheetProps> = ({ result, columns }) => {
  if (!result) {
    return (
      <Box flexDirection="column" width={columns} paddingX={1} marginTop={1}>
        <Text color="gray">No invariant selected. Press [Esc] to return to Hub.</Text>
      </Box>
    );
  }

  const diff = getCodeDiffForInvariant(result);
  const isFail = result.status === 'FAIL';
  const severityColor = result.severity === 'CRITICAL' ? 'red' : result.severity === 'HIGH' ? 'yellow' : 'cyan';

  return (
    <Box flexDirection="column" width={columns} paddingX={1}>
      {/* 1. Header Banner */}
      <Box marginTop={1} justifyContent="space-between" width={columns - 2} flexWrap="nowrap">
        <Box gap={1} flexWrap="nowrap">
          <Text bold color={isFail ? 'red' : 'green'}>
            [{result.testId}] {safeTruncate(result.title || result.testName, columns - 30)}
          </Text>
        </Box>
        <Box gap={1} flexWrap="nowrap">
          <Text color={severityColor} bold>
            [{result.severity}]
          </Text>
          <Text color={isFail ? 'red' : 'green'} bold>
            [{result.status}]
          </Text>
        </Box>
      </Box>

      {/* 2. Issue Summary & Impact */}
      <Box marginTop={1} flexDirection="column" width={columns - 2}>
        <Text bold color="white">
          ISSUE SUMMARY
        </Text>
        <Text color="gray">
          {result.summary}
        </Text>

        <Box marginTop={1} gap={1} flexWrap="nowrap">
          <Text bold color="white">SOURCE LOCATION: </Text>
          <Text color="cyan" bold>
            {diff.file}:{result.lineNumber || diff.startLine}
          </Text>
        </Box>

        {result.rootCause && (
          <Box marginTop={0} gap={1} flexWrap="nowrap">
            <Text bold color="yellow">ROOT CAUSE: </Text>
            <Text color="white">{result.rootCause}</Text>
          </Box>
        )}
      </Box>

      {/* 3. Horizontal Rule */}
      <Box width={columns} marginTop={1}>
        <Text color="gray">{THEME.symbols.rule.repeat(Math.max(10, columns))}</Text>
      </Box>

      {/* 4. Full-Width Code Diff with Real Invariant Lines */}
      <Box flexDirection="column" marginTop={0} width={columns - 2}>
        <Text bold color="white">
          PROPOSED CODE REMEDIATION
        </Text>
        <Text color="gray">
          {result.suggestedFix || 'Wrap state mutation in a PostgreSQL SERIALIZABLE transaction or use a Redis distributed lock.'}
        </Text>

        <Box flexDirection="column" marginTop={1} paddingLeft={1}>
          {diff.lines.map((l, idx) => {
            const isAdd = l.type === 'add';
            const isRemove = l.type === 'remove';
            const textColor = isAdd ? 'green' : isRemove ? 'red' : 'gray';

            return (
              <Box key={idx} flexWrap="nowrap">
                <Text color="gray">{String(l.lineNum).padStart(2, ' ')} │ </Text>
                <Text color={textColor} bold={isAdd || isRemove}>
                  {l.code}
                </Text>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};
