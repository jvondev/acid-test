import React from 'react';
import { Box, Text } from 'ink';
import type { TuiTab, HealthGrade } from '../types.js';
import { safeTruncate, formatMoney, getHealthColor, THEME } from '../theme.js';

interface HeaderProps {
  currentTab: TuiTab;
  targetUrl: string;
  targetLatencyMs: number;
  isSandbox: boolean;
  healthScore: number;
  healthGrade: HealthGrade;
  totalRiskUsd: number;
  counts: Record<TuiTab, number>;
  columns: number;
}

const TABS: { id: TuiTab; label: string; num: string }[] = [
  { id: 'overview', label: 'All', num: '1' },
  { id: 'billing', label: 'Billing', num: '2' },
  { id: 'db', label: 'DB', num: '3' },
  { id: 'auth', label: 'Auth', num: '4' },
  { id: 'queue', label: 'Queue', num: '5' },
  { id: 'webhook', label: 'Webhooks', num: '6' },
  { id: 'ai', label: 'AI', num: '7' },
  { id: 'email', label: 'Email', num: '8' },
  { id: 'storage', label: 'Storage', num: '9' },
];

export const HeaderRibbon: React.FC<HeaderProps> = ({
  currentTab,
  targetUrl,
  targetLatencyMs,
  isSandbox,
  healthScore,
  healthGrade,
  totalRiskUsd,
  counts,
  columns,
}) => {
  const healthColor = getHealthColor(healthScore);
  const targetDisplay = safeTruncate(targetUrl, 26);

  return (
    <Box flexDirection="column" width={columns}>
      {/* Row 1: Quiet Telemetry Ribbon */}
      <Box justifyContent="space-between" width={columns} flexWrap="nowrap">
        <Box gap={1} flexWrap="nowrap">
          <Text bold color="cyan">
            ACIDTEST
          </Text>
          <Text color="gray">{THEME.symbols.divider}</Text>
          <Text color="white">
            {targetDisplay}{' '}
            {isSandbox ? (
              <Text color="yellow">(Sandbox Target)</Text>
            ) : targetLatencyMs > 0 ? (
              <Text color="green">({targetLatencyMs}ms live)</Text>
            ) : (
              <Text color="gray">(probed)</Text>
            )}
          </Text>
        </Box>

        <Box gap={1} flexWrap="nowrap">
          <Text color="gray">Health: </Text>
          <Text bold color={healthColor}>
            {healthGrade} ({healthScore}/100)
          </Text>
          <Text color="gray">{THEME.symbols.divider}</Text>
          <Text color="gray">Risk: </Text>
          <Text bold color={totalRiskUsd > 0 ? 'red' : 'green'}>
            {formatMoney(totalRiskUsd)}/mo
          </Text>
        </Box>
      </Box>

      {/* Row 2: Clean Compact Domain Filter Bar */}
      <Box marginTop={0} width={columns} flexWrap="nowrap">
        {TABS.map((tab, idx) => {
          const isActive = tab.id === currentTab;
          const count = counts[tab.id] || 0;
          return (
            <React.Fragment key={tab.id}>
              {idx > 0 && <Text color="gray"> </Text>}
              <Text
                color={isActive ? 'black' : 'gray'}
                backgroundColor={isActive ? 'cyan' : undefined}
                bold={isActive}
              >
                {` [${tab.num}] ${tab.label}: ${count} `}
              </Text>
            </React.Fragment>
          );
        })}
      </Box>

      {/* Horizontal Divider Rule */}
      <Box width={columns}>
        <Text color="gray">{THEME.symbols.rule.repeat(Math.max(10, columns))}</Text>
      </Box>
    </Box>
  );
};
