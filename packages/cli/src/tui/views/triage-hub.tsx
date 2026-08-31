import React from 'react';
import { Box, Text } from 'ink';
import type { InvariantResult, HealthGrade } from '@acidtest/core';
import { THEME, renderBar, formatMoney, safeTruncate } from '../theme.js';

interface TriageHubProps {
  healthScore: number;
  healthGrade: HealthGrade;
  totalRiskUsd: number;
  allResults: InvariantResult[];
  selectedIndex: number;
  columns: number;
}

interface DomainSummary {
  name: string;
  category: string;
  passed: number;
  total: number;
  riskNote: string;
}

export const TriageHub: React.FC<TriageHubProps> = ({
  healthScore,
  healthGrade,
  totalRiskUsd,
  allResults,
  selectedIndex,
  columns,
}) => {
  const total = allResults.length;
  const failures = allResults.filter((r) => r.status === 'FAIL');
  const criticalCount = failures.filter((r) => r.severity === 'CRITICAL').length;

  // Domain aggregations
  const domains: DomainSummary[] = [
    {
      name: 'Billing',
      category: 'billing',
      passed: allResults.filter((r) => r.category.includes('billing') && r.status === 'PASS').length,
      total: allResults.filter((r) => r.category.includes('billing')).length,
      riskNote: totalRiskUsd > 0 ? `${formatMoney(totalRiskUsd)}/mo unbilled seats` : 'Clean ledger',
    },
    {
      name: 'Database',
      category: 'db',
      passed: allResults.filter((r) => r.category.includes('db') && r.status === 'PASS').length,
      total: allResults.filter((r) => r.category.includes('db')).length,
      riskNote: 'Non-serializable read hazards',
    },
    {
      name: 'Webhooks',
      category: 'webhook',
      passed: allResults.filter((r) => r.category.includes('webhook') && r.status === 'PASS').length,
      total: allResults.filter((r) => r.category.includes('webhook')).length,
      riskNote: 'Missing signature idempotency',
    },
    {
      name: 'Queues',
      category: 'queue',
      passed: allResults.filter((r) => r.category.includes('queue') && r.status === 'PASS').length,
      total: allResults.filter((r) => r.category.includes('queue')).length,
      riskNote: 'Healthy',
    },
    {
      name: 'Auth',
      category: 'auth',
      passed: allResults.filter((r) => r.category.includes('auth') && r.status === 'PASS').length,
      total: allResults.filter((r) => r.category.includes('auth')).length,
      riskNote: 'Healthy',
    },
  ].filter((d) => d.total > 0);

  // Issues queue (failures first, then rest)
  const displayItems = failures.length > 0 ? failures : allResults.slice(0, 6);

  return (
    <Box flexDirection="column" width={columns} paddingX={1}>
      {/* 1. Verdict Headline */}
      <Box marginTop={1} flexDirection="column">
        <Text bold color={failures.length > 0 ? 'red' : 'green'}>
          {failures.length > 0
            ? `RELIABILITY VERDICT: ${criticalCount > 0 ? 'CRITICAL' : 'MODERATE'} REVENUE RISK DETECTED`
            : 'RELIABILITY VERDICT: ALL INVARIANTS PASSING UNDER CHAOS BURST'}
        </Text>
        <Text color="gray">
          {failures.length > 0
            ? `${failures.length} of ${total} invariants failed across active backend integrations.`
            : `All ${total} distributed invariants verified with zero financial exposure or tenant leaks.`}
        </Text>
      </Box>

      {/* 2. Domain Breakdown Strips */}
      <Box marginTop={1} flexDirection="column">
        <Text bold color="white">
          DOMAINS AT A GLANCE
        </Text>
        {domains.map((dom) => {
          const isDomainFailed = dom.passed < dom.total;
          const barColor = isDomainFailed ? 'red' : 'green';
          return (
            <Box key={dom.name} gap={2} flexWrap="nowrap">
              <Text color="gray">{dom.name.padEnd(12, ' ')}</Text>
              <Text color={barColor}>{renderBar(dom.passed, dom.total, 10)}</Text>
              <Text color="white">
                {dom.passed}/{dom.total} passed
              </Text>
              <Text color="gray">{THEME.symbols.divider}</Text>
              <Text color={isDomainFailed ? 'yellow' : 'gray'}>
                {dom.riskNote}
              </Text>
            </Box>
          );
        })}
      </Box>

      {/* 3. Actionable Issues Triage Queue */}
      <Box marginTop={1} flexDirection="column">
        <Text bold color="white">
          {failures.length > 0
            ? `ACTION REQUIRED (${failures.length} ISSUE${failures.length > 1 ? 'S' : ''} TO RESOLVE)`
            : 'VERIFIED INVARIANTS'}
        </Text>

        {displayItems.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          const isFail = item.status === 'FAIL';
          const title = safeTruncate(item.title || item.testName, Math.max(20, columns - 45));

          return (
            <Box
              key={item.testId}
              justifyContent="space-between"
              width={columns - 2}
              backgroundColor={isSelected ? 'cyan' : undefined}
              flexWrap="nowrap"
            >
              <Box gap={1} flexWrap="nowrap">
                <Text color={isSelected ? 'black' : 'cyan'} bold={isSelected}>
                  {isSelected ? THEME.symbols.pointer : ' '} {idx + 1}. [{item.testId}]
                </Text>
                <Text color={isSelected ? 'black' : 'white'} bold={isSelected}>
                  {title}
                </Text>
              </Box>

              <Box gap={1} flexWrap="nowrap">
                <Text color={isSelected ? 'black' : isFail ? 'red' : 'green'} bold>
                  {isFail ? `[${item.severity || 'FAIL'}]` : '[PASS]'}
                </Text>
                <Text color={isSelected ? 'black' : 'gray'}>
                  {item.durationMs}ms
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
