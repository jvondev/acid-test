import { describe, it, expect } from 'vitest';
import { FinancialRiskCalculator } from '../src/risk/calculator.js';
import type { InvariantResult } from '../src/types/index.js';

describe('FinancialRiskCalculator', () => {
  it('computes clean Grade A when all invariants pass', () => {
    const results: InvariantResult[] = [
      {
        testId: 'ACID-TEST-001',
        testName: 'Test 1',
        category: 'billing',
        provider: 'stripe',
        severity: 'CRITICAL',
        status: 'PASS',
        durationMs: 10,
        title: 'Title',
        summary: 'Passed',
      },
    ];

    const risk = FinancialRiskCalculator.calculate(results);
    expect(risk.healthScore).toBe(100);
    expect(risk.healthGrade).toBe('A');
    expect(risk.estimatedMonthlyLossUsd).toBe(0);
  });

  it('computes CRITICAL score and dollar risk on billing race condition', () => {
    const results: InvariantResult[] = [
      {
        testId: 'ACID-BILLING-001',
        testName: 'Burst Test',
        category: 'billing',
        provider: 'stripe',
        severity: 'CRITICAL',
        status: 'FAIL',
        durationMs: 10,
        title: 'Double Credit Race Condition',
        summary: 'Failed',
      },
    ];

    const risk = FinancialRiskCalculator.calculate(results, { monthlyGmv: 500_000 });
    expect(risk.healthGrade).toBe('CRITICAL');
    expect(risk.estimatedMonthlyLossUsd).toBe(5000); // 1% of $500k
    expect(risk.totalRiskExposureUsd).toBe(5000);
  });

  it('computes statutory compliance penalty on RLS leak', () => {
    const results: InvariantResult[] = [
      {
        testId: 'ACID-DB-001',
        testName: 'RLS Test',
        category: 'db',
        provider: 'postgresql',
        severity: 'CRITICAL',
        status: 'FAIL',
        durationMs: 10,
        title: 'Cross-Tenant RLS Data Leak',
        summary: 'Failed',
      },
    ];

    const risk = FinancialRiskCalculator.calculate(results);
    expect(risk.compliancePenaltyUsd).toBe(25000);
    expect(risk.totalRiskExposureUsd).toBe(25000);
  });
});
