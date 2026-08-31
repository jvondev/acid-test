import React from 'react';
import { Box, Text } from 'ink';
import type { InvariantResult, HealthGrade } from '@acid-test/core';
import { THEME, formatMoney, renderBar, getHealthColor } from '../theme.js';

interface ScorecardProps {
  healthScore: number;
  healthGrade: HealthGrade;
  totalRiskUsd: number;
  monthlyLossUsd: number;
  compliancePenaltyUsd: number;
  results: InvariantResult[];
  columns: number;
}

export const ExecutiveScorecard: React.FC<ScorecardProps> = ({
  healthScore,
  healthGrade,
  totalRiskUsd,
  monthlyLossUsd,
  compliancePenaltyUsd,
  results,
  columns,
}) => {
  const healthColor = getHealthColor(healthScore);
  const total = results.length;
  const critical = results.filter((r) => r.status === 'FAIL' && r.severity === 'CRITICAL').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

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
        <Text bold color="cyan">
          EXECUTIVE FINANCIAL RISK & ACID RELIABILITY SCORECARD
        </Text>
        <Text bold color={healthColor}>
          GRADE: [{healthGrade} ({healthScore}/100)]
        </Text>
      </Box>

      {/* Summary Narrative */}
      <Box marginTop={1} width={columns - 2}>
        <Text color="white" bold>
          {critical > 0
            ? `🚨 CRITICAL RISK: ${critical} high-severity defect(s) detected causing direct financial double-crediting or RLS leaks.`
            : failed > 0
            ? `⚠️ MODERATE RISK: ${failed} invariant defect(s) detected. Security foundation is stable with isolated idempotency gaps.`
            : `✨ CLEAN AUDIT: All ${total} ACID invariants verified with zero financial exposure or tenant leaks.`}
        </Text>
      </Box>

      {/* Two Column Breakdown */}
      <Box flexDirection="row" marginTop={1} justifyContent="space-between">
        {/* Left: Financial Risk Model */}
        <Box flexDirection="column" width={Math.floor(columns * 0.48)}>
          <Text bold color="yellow">
            FINANCIAL EXPOSURE MODEL
          </Text>
          <Box justifyContent="space-between" marginTop={1} flexWrap="nowrap">
            <Text color="gray">Monthly Transactional Risk:</Text>
            <Text color="white" bold>{formatMoney(monthlyLossUsd)}/mo</Text>
          </Box>
          <Box justifyContent="space-between" flexWrap="nowrap">
            <Text color="gray">Statutory / Data Penalty:</Text>
            <Text color="white" bold>{formatMoney(compliancePenaltyUsd)}</Text>
          </Box>
          <Box justifyContent="space-between" flexWrap="nowrap">
            <Text color="gray">Total Financial Exposure:</Text>
            <Text color={totalRiskUsd > 0 ? 'red' : 'green'} bold>{formatMoney(totalRiskUsd)}/mo</Text>
          </Box>
        </Box>

        {/* Right: ACID Compliance Matrix */}
        <Box flexDirection="column" width={Math.floor(columns * 0.48)}>
          <Text bold color="cyan">
            ACID COMPLIANCE MATRIX
          </Text>
          <Box justifyContent="space-between" marginTop={1} flexWrap="nowrap">
            <Text color="gray">Atomicity (All-or-Nothing):</Text>
            <Text color={atomicity >= 90 ? 'green' : 'red'}>{renderBar(atomicity, 100, 10)} {atomicity}%</Text>
          </Box>
          <Box justifyContent="space-between" flexWrap="nowrap">
            <Text color="gray">Consistency (Ledger Purity):</Text>
            <Text color={consistency >= 90 ? 'green' : 'red'}>{renderBar(consistency, 100, 10)} {consistency}%</Text>
          </Box>
          <Box justifyContent="space-between" flexWrap="nowrap">
            <Text color="gray">Isolation (Multi-Tenant RLS):</Text>
            <Text color={isolation >= 90 ? 'green' : 'red'}>{renderBar(isolation, 100, 10)} {isolation}%</Text>
          </Box>
          <Box justifyContent="space-between" flexWrap="nowrap">
            <Text color="gray">Durability (Queue Recovery):</Text>
            <Text color={durability >= 90 ? 'green' : 'red'}>{renderBar(durability, 100, 10)} {durability}%</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
