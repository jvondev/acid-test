import React from 'react';
import { Box, Text } from 'ink';
import type { TuiTab, HealthGrade } from '../types.js';
import { safeTruncate, THEME, DROPLET_ROWS, WORDMARK_ROWS, BRAND_TAGLINE, getGradientAnsi } from '../theme.js';
import { Tabs } from '../widgets/tabs.js';

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
  timeVal?: number;
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
  counts,
  columns,
  timeVal = 0,
}) => {
  const isCompact = columns < 90;
  const targetDisplay = safeTruncate(targetUrl, 28);

  const tabItems = TABS.map((t) => ({
    ...t,
    count: counts[t.id] || 0,
  }));

  if (isCompact) {
    return (
      <Box flexDirection="column" width={columns}>
        <Box justifyContent="space-between" width={columns} flexWrap="nowrap">
          <Box gap={1} flexWrap="nowrap">
            <Text bold color="green">
              ◆ acidtest
            </Text>
            <Text color="gray">{THEME.symbols.divider}</Text>
            <Text color="white">{targetDisplay}</Text>
          </Box>
          <Text color="green" bold>
            {targetLatencyMs > 0 ? `${targetLatencyMs}ms` : 'live'}
          </Text>
        </Box>
        <Box marginTop={0} width={columns}>
          <Tabs items={tabItems} activeId={currentTab} columns={columns} />
        </Box>
        <Box width={columns}>
          <Text color="gray">{THEME.symbols.rule.repeat(Math.max(10, columns))}</Text>
        </Box>
      </Box>
    );
  }

  // Full Hero Header with Animated Caustics Droplet + Wordmark + Tagline
  return (
    <Box flexDirection="column" width={columns} marginBottom={0}>
      {/* 6-Row Unified Solid Droplet + Wordmark + Tagline */}
      <Box flexDirection="column" width={columns}>
        {DROPLET_ROWS.map((dropRaw, y) => {
          // Left Droplet Column
          const coloredDrop = Array.from(dropRaw).map((c, col) => {
            if (c === ' ') return ' ';
            const caustic = Math.sin(timeVal * 3.0 + y * 1.5 + col * 0.8) * 0.08;
            const t = Math.max(0, Math.min(1, (col / 9) * 0.25 + caustic));
            return `${getGradientAnsi(t)}${c}\x1b[0m`;
          }).join('');

          // Right Side Information
          let rightSide: React.ReactNode = null;
          if (y === 0) {
            const wmRaw = WORDMARK_ROWS[0];
            const coloredWordmark = Array.from(wmRaw).map((c, col) => {
              if (c === ' ') return ' ';
              const t = 0.3 + (col / wmRaw.length) * 0.7;
              return `${getGradientAnsi(t)}${c}\x1b[0m`;
            }).join('');
            rightSide = (
              <Box gap={1} flexWrap="nowrap">
                <Text>{coloredWordmark}</Text>
                <Text color="gray">v1.0.0</Text>
              </Box>
            );
          } else if (y === 1) {
            const wmRaw = WORDMARK_ROWS[1];
            const coloredWordmark = Array.from(wmRaw).map((c, col) => {
              if (c === ' ') return ' ';
              const t = 0.3 + (col / wmRaw.length) * 0.7;
              return `${getGradientAnsi(t)}${c}\x1b[0m`;
            }).join('');
            rightSide = (
              <Box gap={1} flexWrap="nowrap">
                <Text>{coloredWordmark}</Text>
                <Text color="green">
                  {targetDisplay} {isSandbox ? '(sandbox)' : `(${targetLatencyMs}ms)`}
                </Text>
              </Box>
            );
          } else if (y === 2) {
            rightSide = <Text color="gray">{THEME.symbols.rule.repeat(Math.max(10, columns - 16))}</Text>;
          } else if (y === 3) {
            rightSide = (
              <Text bold color="white">
                {BRAND_TAGLINE}
              </Text>
            );
          } else if (y === 4) {
            rightSide = (
              <Text color="gray">
                24 distributed invariants audited • <Text color="green">● Active Concurrency Engine</Text>
              </Text>
            );
          }

          return (
            <Box key={y} flexDirection="row" width={columns} flexWrap="nowrap">
              <Text>{coloredDrop}  </Text>
              {rightSide}
            </Box>
          );
        })}
      </Box>

      {/* Domain Navigation Tabs */}
      <Box marginTop={1} width={columns}>
        <Tabs items={tabItems} activeId={currentTab} columns={columns} />
      </Box>

      {/* Horizontal Divider */}
      <Box width={columns} marginTop={0}>
        <Text color="gray">{THEME.symbols.rule.repeat(Math.max(10, columns))}</Text>
      </Box>
    </Box>
  );
};
