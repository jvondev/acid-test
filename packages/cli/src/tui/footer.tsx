import React from 'react';
import { Box, Text } from 'ink';

interface FooterProps {
  statusMessage?: string;
  isRunning: boolean;
}

export const TuiFooter: React.FC<FooterProps> = ({ statusMessage, isRunning }) => {
  return (
    <Box flexDirection="row" justifyContent="space-between" borderStyle="single" borderColor="cyan" paddingX={1} flexWrap="nowrap">
      <Box gap={1} flexWrap="nowrap">
        <Text color="cyan" bold>[1-9]</Text>
        <Text color="gray">Tabs</Text>

        <Text color="cyan" bold>[↑/↓]</Text>
        <Text color="gray">Select</Text>

        <Text color="cyan" bold>[A]</Text>
        <Text color="gray">Audit</Text>

        <Text color="cyan" bold>[R]</Text>
        <Text color="gray">Re-run</Text>

        <Text color="cyan" bold>[C]</Text>
        <Text color="gray">Copy AI</Text>

        <Text color="cyan" bold>[Q]</Text>
        <Text color="gray">Quit</Text>
      </Box>

      <Box flexWrap="nowrap">
        <Text color={isRunning ? 'yellow' : 'green'} bold>
          {isRunning ? '⚡ EXECUTING BURST...' : statusMessage || '● READY'}
        </Text>
      </Box>
    </Box>
  );
};
