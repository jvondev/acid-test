import type { AuditReport } from '../types/index.js';
import { HTML_REPORT_STYLES } from './html-styles.js';

export class HtmlReportGenerator {
  static generate(report: AuditReport): string {
    const { id, timestamp, target, module, provider, healthScore, healthGrade, results, totalRiskUsd, executiveSummary, invariantsTested, invariantsPassed, invariantsFailed, durationMs } = report;

    const rows = results
      .map(
        (r) => `
        <tr>
          <td><span class="status-tag status-${r.status}">${r.status}</span></td>
          <td><strong>${r.testId}</strong><br/><span style="color:var(--text-dim);font-size:0.8rem;">${r.testName}</span></td>
          <td><span class="severity-${r.severity}">${r.severity}</span></td>
          <td>
            ${r.summary}
            ${r.rootCause ? `<br/><small style="color:var(--text-dim);"><strong>Cause:</strong> ${r.rootCause}</small>` : ''}
            ${r.suggestedFix ? `<br/><small style="color:#10b981;"><strong>Fix:</strong> ${r.suggestedFix}</small>` : ''}
            ${r.curlReproduction ? `<div class="code-block">${r.curlReproduction}</div>` : ''}
          </td>
          <td>${r.durationMs}ms</td>
        </tr>`
      )
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acid-test Audit Report • ${module.toUpperCase()}</title>
  <style>${HTML_REPORT_STYLES}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title-group">
        <h1>Acid-test Integrity Audit</h1>
        <p>Target: <code>${target}</code> • Module: <strong>${module.toUpperCase()}</strong> (${provider}) • Report ID: <code>${id}</code></p>
      </div>
      <div class="grade-badge grade-${healthGrade}">${healthGrade} (${healthScore}/100)</div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-title">Invariants Tested</div>
        <div class="kpi-val">${invariantsTested}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Passed / Failed</div>
        <div class="kpi-val" style="color:${invariantsFailed > 0 ? 'var(--red)' : 'var(--green)'};">
          ${invariantsPassed} / ${invariantsFailed}
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Monthly Risk Exposure</div>
        <div class="kpi-val" style="color:var(--yellow);">$${totalRiskUsd.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Audit Duration</div>
        <div class="kpi-val">${(durationMs / 1000).toFixed(2)}s</div>
      </div>
    </div>

    <div class="kpi-card" style="margin-bottom:2rem; border-left: 4px solid ${invariantsFailed > 0 ? 'var(--red)' : 'var(--green)'};">
      <div class="kpi-title">Executive Diagnosis</div>
      <p style="margin:0; font-size:1rem; line-height:1.5;">${executiveSummary}</p>
    </div>

    <h2 class="section-title">Invariant Verification Details</h2>
    <table class="test-table">
      <thead>
        <tr>
          <th>Status</th>
          <th>Invariant ID & Title</th>
          <th>Severity</th>
          <th>Findings & Remediation</th>
          <th>Duration</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="footer">
      Generated automatically by Acid-test Adversarial Audit Engine • Timestamp: ${timestamp}
    </div>
  </div>
</body>
</html>`;
  }
}

export { HtmlReportGenerator as HtmlReporter };
