import React from 'react';
import { Box, Text } from 'ink';
import type { InvariantResult, HealthGrade } from '@acid-test/core';
import { THEME, renderBar, getHealthColor } from '../theme.js';

interface ScorecardProps {
  healthScore: number;
  healthGrade: HealthGrade;
  totalRiskUsd?: number;
  monthlyLossUsd?: number;
  compliancePenaltyUsd?: number;
  results: InvariantResult[];
  columns: number;
}

export const ExecutiveScorecard: React.FC<ScorecardProps> = ({
  healthScore,
  healthGrade,
  results,
  columns,
}) => {
  const healthColor = getHealthColor(healthScore);
  const total = results.length;
  const critical = results.filter((r) => r.status === 'FAIL' && r.severity === 'CRITICAL').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const passed = results.filter((r) => r.status === 'PASS').length;

  const getAcidRate = (cat: string) => {
    const subset = results.filter((r) => r.category === cat || r.testId.toLowerCase().includes(cat));
    if (subset.length === 0) return 100;
    const pass = subset.filter((r) => r.status === 'PASS').length;
    return Math.round((pass / subset.length) * 100);
  };

  const atomicity = getAcidRate('queue');
  const consistency = getAcidRate('billing');
  const isolation = getAcidRate('db');
  const durability = getAcidRate('webhook');

  return (
    <Box flexDirection="column" width={columns} paddingX={1}>
      {/* Title */}
      <Box marginTop={1} justifyContent="space-between" width={columns - 2} flexWrap="nowrap">
        <Text bold color="green">
          ACID DISTRIBUTED RELIABILITY SCORECARD
        </Text>
        <Text bold color={healthColor}>
          STATUS: [{healthGrade} ({healthScore}/100)]
        </Text>
      </Box>

      {/* Summary Narrative */}
      <Box marginTop={1} width={columns - 2}>
        <Text color="white" bold>
          {critical > 0
            ? `FAIL: ${critical} critical defect(s) detected causing state corruption or tenant data leaks.`
            : failed > 0
            ? `WARN: ${failed} invariant defect(s) detected. Core isolation stable with isolated idempotency gaps.`
            : `PASS: All ${total} ACID invariants verified under concurrent microsecond bursts.`}
        </Text>
      </Box>

      {/* Two Column Breakdown */}
      <Box flexDirection="row" marginTop={1} justifyContent="space-between">
        {/* Left: Audit Metrics */}
        <Box flexDirection="column" width={Math.floor(columns * 0.48)}>
          <Text bold color="cyan">
            EXECUTION METRICS
          </Text>
          <Box justifyContent="space-between" marginTop={1} flexWrap="nowrap">
            <Text color="gray">Invariants Audited:</Text>
            <Text color="white" bold>{total} total</Text>
          </Box>
          <Box justifyContent="space-between" flexWrap="nowrap">
            <Text color="gray">Passing Invariants:</Text>
            <Text color="green" bold>{passed} verified</Text>
          </Box>
          <Box justifyContent="space-between" flexWrap="nowrap">
            <Text color="gray">Failing Invariants:</Text>
            <Text color={failed > 0 ? 'red' : 'green'} bold>{failed} issues</Text>
          </Box>
        </Box>

        {/* Right: ACID Compliance Matrix */}
        <Box flexDirection="column" width={Math.floor(columns * 0.48)}>
          <Text bold color="green">
            ACID INVARIANT COMPLIANCE
          </Text>
          <Box justifyContent="space-between" marginTop={1} flexWrap="nowrap">
            <Text color="gray">Atomicity (All-or-Nothing):</Text>
            <Text color={atomicity >= 90 ? 'green' : 'red'}>{renderBar(atomicity, 100, 10)} {atomicity}%</Text>
          </Box>
          <Box justifyContent="space-between" flexWrap="nowrap">
            <Text color="gray">Consistency (State Purity):</Text>
            <Text color={consistency >= 90 ? 'green' : 'red'}>{renderBar(consistency, 100, 10)} {consistency}%</Text>
          </Box>
          <Box justifyContent="space-between" flexWrap="nowrap">
            <Text color="gray">Isolation (Multi-Tenant RLS):</Text>
            <Text color={isolation >= 90 ? 'green' : 'red'}>{renderBar(isolation, 100, 10)} {isolation}%</Text>
          </Box>
          <Box justifyContent="space-between" flexWrap="nowrap">
            <Text color="gray">Durability (Delivery Recovery):</Text>
            <Text color={durability >= 90 ? 'green' : 'red'}>{renderBar(durability, 100, 10)} {durability}%</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
