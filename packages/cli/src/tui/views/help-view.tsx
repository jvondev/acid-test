import React from 'react';
import { Box, Text } from 'ink';

interface HelpProps {
  columns: number;
}

export const HelpView: React.FC<HelpProps> = ({ columns }) => {
  return (
    <Box flexDirection="column" width={columns} paddingX={1}>
      <Box marginTop={1} justifyContent="space-between" width={columns - 2} flexWrap="nowrap">
        <Text bold color="cyan">
          KEYBOARD SHORTCUTS & INTERACTIVE MANUAL
        </Text>
        <Text color="yellow">Press [?] or [Esc] to return</Text>
      </Box>

      <Box flexDirection="column" marginTop={1} width={columns - 2}>
        <Box gap={2} flexWrap="nowrap">
          <Text color="cyan" bold>[↑/↓ / j/k]</Text>
          <Text color="white">Navigate through invariant issues queue</Text>
        </Box>
        <Box gap={2} flexWrap="nowrap">
          <Text color="cyan" bold>[Enter]    </Text>
          <Text color="white">Inspect selected issue: open full-width diagnostic code diff</Text>
        </Box>
        <Box gap={2} flexWrap="nowrap">
          <Text color="green" bold>[F]        </Text>
          <Text color="white">Auto-Fix active invariant: exports prompt to .acidtest/remediation.prompt.md</Text>
        </Box>
        <Box gap={2} flexWrap="nowrap">
          <Text color="cyan" bold>[V]        </Text>
          <Text color="white">Toggle Executive Scorecard & ACID Financial Exposure Model</Text>
        </Box>
        <Box gap={2} flexWrap="nowrap">
          <Text color="cyan" bold>[Space / A]</Text>
          <Text color="white">Run full adversarial audit suite against target backend</Text>
        </Box>
        <Box gap={2} flexWrap="nowrap">
          <Text color="yellow" bold>[C]        </Text>
          <Text color="white">Open Chaos Proving Ground: tune worker concurrency and microsecond jitter</Text>
        </Box>
        <Box gap={2} flexWrap="nowrap">
          <Text color="cyan" bold>[/]        </Text>
          <Text color="white">Filter invariant matrix by Severity (Critical/High/Med) or Status</Text>
        </Box>
        <Box gap={2} flexWrap="nowrap">
          <Text color="cyan" bold>[H]        </Text>
          <Text color="white">Export Standalone HTML Audit Report to .acidtest/reports/</Text>
        </Box>
        <Box gap={2} flexWrap="nowrap">
          <Text color="cyan" bold>[Q / Esc]  </Text>
          <Text color="white">Exit or return to previous screen</Text>
        </Box>
      </Box>
    </Box>
  );
};
