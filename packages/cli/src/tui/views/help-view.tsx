import React from 'react';
import { Box, Text } from 'ink';

interface HelpProps {
  columns: number;
}

export const HelpView: React.FC<HelpProps> = ({ columns }) => {
  return (
    <Box flexDirection="column" width={columns} paddingX={1}>
      <Box marginTop={1} justifyContent="space-between" width={columns - 2} flexWrap="nowrap">
        <Text bold color="green">
          KEYBOARD SHORTCUTS & INTERACTION MANUAL
        </Text>
        <Text color="gray">Press [?] or [Esc] to return</Text>
      </Box>

      <Box flexDirection="column" marginTop={1} width={columns - 2}>
        <Box gap={2} flexWrap="nowrap">
          <Text color="green" bold>[↑/↓ / j/k]</Text>
          <Text color="white">Navigate through invariants queue</Text>
        </Box>
        <Box gap={2} flexWrap="nowrap">
          <Text color="green" bold>[Enter / F] </Text>
          <Text color="white">Apply Code Remediation / export patch to .acidtest/remediation.prompt.md</Text>
        </Box>
        <Box gap={2} flexWrap="nowrap">
          <Text color="cyan" bold>[Space / A]</Text>
          <Text color="white">Replay adversarial concurrency audit burst against target backend</Text>
        </Box>
        <Box gap={2} flexWrap="nowrap">
          <Text color="cyan" bold>[V]        </Text>
          <Text color="white">Toggle ACID Reliability Scorecard & Compliance Matrix</Text>
        </Box>
        <Box gap={2} flexWrap="nowrap">
          <Text color="yellow" bold>[C]        </Text>
          <Text color="white">Configure Chaos Engine: worker concurrency (N) and microsecond jitter</Text>
        </Box>
        <Box gap={2} flexWrap="nowrap">
          <Text color="cyan" bold>[/]        </Text>
          <Text color="white">Filter invariant matrix by Severity (Critical/High/Med) or Status</Text>
        </Box>
        <Box gap={2} flexWrap="nowrap">
          <Text color="cyan" bold>[H]        </Text>
          <Text color="white">Export Standalone HTML Audit Report</Text>
        </Box>
        <Box gap={2} flexWrap="nowrap">
          <Text color="gray" bold>[Q / Esc]  </Text>
          <Text color="white">Exit application or dismiss active overlay</Text>
        </Box>
      </Box>
    </Box>
  );
};
