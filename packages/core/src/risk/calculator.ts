import type { InvariantResult, Severity, HealthGrade } from '../types/index.js';

export interface RiskProfile {
  monthlyGmv: number;
  ticketSize: number;
  monthlyVolume: number;
}

export interface RiskAnalysisResult {
  healthScore: number; // 0 to 100
  healthGrade: HealthGrade;
  scoreStatus: 'CLEAN' | 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' | 'CRITICAL';
  estimatedMonthlyLossUsd: number;
  compliancePenaltyUsd: number;
  totalRiskExposureUsd: number;
  executiveDiagnosis: string;
}

export class FinancialRiskCalculator {
  private static DEFAULT_PROFILE: RiskProfile = {
    monthlyGmv: 450_000,
    ticketSize: 50,
    monthlyVolume: 9_000,
  };

  /**
   * Calculates estimated dollar exposure and health grade from invariant results
   */
  static calculate(results: InvariantResult[], customProfile?: Partial<RiskProfile>): RiskAnalysisResult {
    const monthlyGmv = customProfile?.monthlyGmv ?? this.DEFAULT_PROFILE.monthlyGmv;
    const ticketSize = customProfile?.ticketSize ?? this.DEFAULT_PROFILE.ticketSize;
    const monthlyVolume = customProfile?.monthlyVolume ?? this.DEFAULT_PROFILE.monthlyVolume;

    const profile: RiskProfile = {
      monthlyGmv,
      ticketSize,
      monthlyVolume,
    };

    let monthlyDirectLoss = 0;
    let compliancePenalty = 0;
    let penaltyScoreDeduction = 0;

    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    const failedResults = results.filter((r) => r.status === 'FAIL');

    for (const res of failedResults) {
      switch (res.severity) {
        case 'CRITICAL':
          criticalCount++;
          penaltyScoreDeduction += 30;
          break;
        case 'HIGH':
          highCount++;
          penaltyScoreDeduction += 15;
          break;
        case 'MEDIUM':
          mediumCount++;
          penaltyScoreDeduction += 5;
          break;
        case 'LOW':
          lowCount++;
          penaltyScoreDeduction += 2;
          break;
      }

      // Domain-specific financial modeling
      if (res.category === 'billing' || res.testId.includes('BILLING')) {
        // Race conditions causing double-provisioning or uncollected revenue
        const probFail = 0.01; // 1% failure rate under concurrent traffic
        const directRisk = profile.monthlyGmv * probFail;
        monthlyDirectLoss += directRisk;
      } else if (res.category === 'db' || res.testId.includes('DB')) {
        if (res.testId.includes('RLS') || res.title.toLowerCase().includes('rls') || res.title.toLowerCase().includes('leak')) {
          compliancePenalty += 25_000; // Statutory GDPR / security incident liability
        }
        if (res.testId.includes('INDEX') || res.title.toLowerCase().includes('index') || res.title.toLowerCase().includes('n+1')) {
          monthlyDirectLoss += 800; // Extra server compute scaling cost
        }
      } else if (res.category === 'auth' || res.testId.includes('AUTH')) {
        compliancePenalty += 15_000; // Unauthorized access / credential replay penalty
      } else if (res.category === 'queue' || res.testId.includes('QUEUE')) {
        monthlyDirectLoss += 3_000; // Worker crash death spiral / downtime loss
      } else if (res.category === 'webhook' || res.testId.includes('WEBHOOK')) {
        if (res.testId.includes('TIMING') || res.testId.includes('REPLAY')) {
          compliancePenalty += 10_000;
        }
      } else if (res.category === 'ai' || res.testId.includes('AI')) {
        monthlyDirectLoss += 1_200; // Aborted SSE stream token burning
      } else if (res.category === 'storage' || res.testId.includes('STORAGE')) {
        compliancePenalty += 15_000; // Public bucket exposure / asset overwrite
      } else if (res.category === 'email' || res.testId.includes('EMAIL')) {
        monthlyDirectLoss += 500; // Broken link / missing template var bounce
      }
    }

    const rawScore = Math.max(0, 100 - penaltyScoreDeduction);
    const healthScore = Math.min(100, Math.round(rawScore));

    let healthGrade: HealthGrade;
    let scoreStatus: 'CLEAN' | 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' | 'CRITICAL';

    if (criticalCount > 0 || healthScore < 60) {
      healthGrade = 'CRITICAL';
      scoreStatus = 'CRITICAL';
    } else if (healthScore >= 90) {
      healthGrade = 'A';
      scoreStatus = 'CLEAN';
    } else if (healthScore >= 80) {
      healthGrade = 'B';
      scoreStatus = 'LOW_RISK';
    } else if (healthScore >= 70) {
      healthGrade = 'C';
      scoreStatus = 'MEDIUM_RISK';
    } else {
      healthGrade = 'D';
      scoreStatus = 'HIGH_RISK';
    }

    const totalRiskExposureUsd = monthlyDirectLoss + compliancePenalty;

    let executiveDiagnosis: string;
    if (failedResults.length === 0) {
      executiveDiagnosis = 'All ACID and adversarial security invariants satisfied. Zero critical financial or isolation leaks detected.';
    } else if (criticalCount > 0) {
      executiveDiagnosis = `CRITICAL RISK DETECTED: Found ${criticalCount} critical invariant violation(s) that directly expose user data, cause financial double-crediting, or crash production processes. Immediate remediation required.`;
    } else if (highCount > 0) {
      executiveDiagnosis = `HIGH RISK DETECTED: Found ${highCount} high-severity defect(s) including missing signature verification, unindexed table scans, or retry storm loops.`;
    } else {
      executiveDiagnosis = `MODERATE RISK: System passed core security checks but has ${failedResults.length} minor resiliency or idempotency defects.`;
    }

    return {
      healthScore,
      healthGrade,
      scoreStatus,
      estimatedMonthlyLossUsd: Math.round(monthlyDirectLoss),
      compliancePenaltyUsd: Math.round(compliancePenalty),
      totalRiskExposureUsd: Math.round(totalRiskExposureUsd),
      executiveDiagnosis,
    };
  }
}
