import React from 'react';
import { Box, Text } from 'ink';
import type { TuiTab, HealthGrade } from './types.js';

interface HeaderProps {
  currentTab: TuiTab;
  healthScore: number;
  healthGrade: HealthGrade;
  totalRiskUsd: number;
  targetUrl: string;
  targetLatencyMs: number;
  columns?: number;
}

const TABS: { id: TuiTab; label: string; num: string }[] = [
  { id: 'overview', label: 'All', num: '1' },
  { id: 'billing', label: 'Billing', num: '2' },
  { id: 'db', label: 'DB', num: '3' },
  { id: 'auth', label: 'Auth', num: '4' },
  { id: 'queue', label: 'Queue', num: '5' },
  { id: 'webhook', label: 'Webhook', num: '6' },
  { id: 'ai', label: 'AI', num: '7' },
  { id: 'email', label: 'Email', num: '8' },
  { id: 'storage', label: 'Storage', num: '9' },
];

export const TuiHeader: React.FC<HeaderProps> = ({
  currentTab,
  healthScore,
  healthGrade,
  totalRiskUsd,
  targetUrl,
  targetLatencyMs,
}) => {
  const gradeColor = healthGrade === 'A+' || healthGrade === 'A' ? 'green' : healthGrade === 'B' ? 'cyan' : healthGrade === 'C' ? 'yellow' : 'red';
  const isLive = targetLatencyMs > 0;

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="cyan" paddingX={1}>
      <Box justifyContent="space-between" flexWrap="nowrap">
        <Text bold color="cyan">
          ⚡ ACIDTEST v1.0 • ADVERSARIAL RELIABILITY & CHAOS PROVING GROUND
        </Text>
        <Box gap={1} flexWrap="nowrap">
          <Text color="gray">Target:</Text>
          <Text color="white" bold>{targetUrl}</Text>
          <Text color={isLive ? 'green' : 'yellow'} bold>
            ({isLive ? `${targetLatencyMs}ms live` : 'offline - code AST mode'})
          </Text>
        </Box>
      </Box>

      <Box justifyContent="space-between" marginTop={0} flexWrap="nowrap">
        <Box gap={1} flexWrap="nowrap">
          {TABS.map((tab) => {
            const isActive = tab.id === currentTab;
            return (
              <Box key={tab.id}>
                <Text
                  color={isActive ? 'black' : 'gray'}
                  backgroundColor={isActive ? 'cyan' : undefined}
                  bold={isActive}
                >
                  {`[${tab.num}] ${tab.label}`}
                </Text>
              </Box>
            );
          })}
        </Box>

        <Box gap={2} flexWrap="nowrap">
          <Text color="gray">
            Health: <Text bold color={gradeColor}>{healthGrade} ({healthScore}/100)</Text>
          </Text>
          <Text color="gray">
            Exposure: <Text bold color={totalRiskUsd > 0 ? 'yellow' : 'green'}>${totalRiskUsd.toLocaleString()}/mo</Text>
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
