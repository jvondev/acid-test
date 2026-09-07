import fs from 'node:fs';
import path from 'node:path';
import type { InvariantResult, AuditReport } from '@acid-test/core';
import { HtmlReporter, FinancialRiskCalculator } from '@acid-test/core';

export function exportHtmlAuditReport(results: InvariantResult[], targetUrl: string): string | null {
  try {
    const dir = path.join(process.cwd(), '.acid-test', 'reports');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const risk = FinancialRiskCalculator.calculate(results);
    const passed = results.filter((r) => r.status === 'PASS').length;
    const failed = results.filter((r) => r.status === 'FAIL').length;
    const skipped = results.filter((r) => r.status === 'SKIP').length;
    const durationMs = results.reduce((acc, r) => acc + (r.durationMs || 0), 0);

    const auditReport: AuditReport = {
      version: '1.0.0',
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      target: targetUrl,
      module: 'ALL',
      provider: 'universal',
      score: risk.healthGrade === 'A+' || risk.healthGrade === 'A' ? 'CLEAN' : 'CRITICAL',
      healthScore: risk.healthScore,
      healthGrade: risk.healthGrade,
      financialRiskUsdMonthly: risk.estimatedMonthlyLossUsd,
      complianceRiskUsd: risk.compliancePenaltyUsd,
      totalRiskUsd: risk.totalRiskExposureUsd,
      executiveSummary: `${results.length} total invariants audited. ${passed} passed, ${failed} failed. Total monthly exposure: $${risk.totalRiskExposureUsd.toLocaleString()}.`,
      invariantsTested: results.length,
      invariantsPassed: passed,
      invariantsFailed: failed,
      invariantsSkipped: skipped,
      durationMs,
      results,
      remediations: [],
    };

    const reportHtml = HtmlReporter.generate(auditReport);
    const filename = `audit-${Date.now()}.html`;
    const targetFile = path.join(dir, filename);
    fs.writeFileSync(targetFile, reportHtml, 'utf-8');
    return targetFile;
  } catch {
    return null;
  }
}
