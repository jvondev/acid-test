import React from 'react';
import { Box, Text } from 'ink';
import type { ChaosConfig } from '../types.js';

interface ChaosLabProps {
  config: ChaosConfig;
  isRunning: boolean;
  columns: number;
}

export const ChaosLabView: React.FC<ChaosLabProps> = ({ config, isRunning, columns }) => {
  return (
    <Box flexDirection="column" width={columns} paddingX={1}>
      <Box marginTop={1} justifyContent="space-between" width={columns - 2} flexWrap="nowrap">
        <Text bold color="yellow">
          ADVERSARIAL CHAOS PROVING GROUND & FUZZING LAB
        </Text>
        <Text color="gray">Press [C] or [Esc] to return</Text>
      </Box>

      <Box flexDirection="column" marginTop={1} width={columns - 2}>
        {/* Concurrency setting */}
        <Box justifyContent="space-between" flexWrap="nowrap">
          <Text color="cyan" bold>Worker Concurrency (N):</Text>
          <Box gap={1} flexWrap="nowrap">
            {[10, 25, 50, 100].map((val) => {
              const active = config.concurrency === val;
              return (
                <Text
                  key={val}
                  color={active ? 'black' : 'gray'}
                  backgroundColor={active ? 'yellow' : undefined}
                  bold={active}
                >
                  {` ${val} `}
                </Text>
              );
            })}
          </Box>
        </Box>

        {/* Jitter setting */}
        <Box justifyContent="space-between" marginTop={1} flexWrap="nowrap">
          <Text color="cyan" bold>Microsecond Jitter Window:</Text>
          <Box gap={1} flexWrap="nowrap">
            {[0, 5, 25, 100].map((val) => {
              const active = config.jitterMs === val;
              return (
                <Text
                  key={val}
                  color={active ? 'black' : 'gray'}
                  backgroundColor={active ? 'yellow' : undefined}
                  bold={active}
                >
                  {` ${val}ms `}
                </Text>
              );
            })}
          </Box>
        </Box>
      </Box>

      <Box marginTop={1} justifyContent="space-between" width={columns - 2} flexWrap="nowrap">
        <Text color="gray">
          Press <Text color="yellow" bold>[1-4]</Text> Concurrency | <Text color="yellow" bold>[5-8]</Text> Jitter
        </Text>
        <Text color={isRunning ? 'yellow' : 'green'} bold>
          {isRunning ? '⚡ INJECTING CHAOS BURST...' : 'Press [Space] to Dispatch Burst'}
        </Text>
      </Box>
    </Box>
  );
};
