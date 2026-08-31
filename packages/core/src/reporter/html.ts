import type { AuditReport } from '../types/index.js';

export class HtmlReportGenerator {
  /**
   * Generates a standalone, responsive, single-file HTML audit report
   */
  static generate(report: AuditReport): string {
    const passedCount = report.invariantsPassed;
    const failedCount = report.invariantsFailed;
    const totalCount = report.invariantsTested;

    const gradeColor =
      report.healthGrade === 'A+' || report.healthGrade === 'A'
        ? '#10b981'
        : report.healthGrade === 'B'
        ? '#3b82f6'
        : report.healthGrade === 'C'
        ? '#f59e0b'
        : '#ef4444';

    const resultsHtml = report.results
      .map((r, idx) => {
        const isFail = r.status === 'FAIL';
        const badgeColor =
          r.severity === 'CRITICAL'
            ? '#ef4444'
            : r.severity === 'HIGH'
            ? '#f97316'
            : r.severity === 'MEDIUM'
            ? '#eab308'
            : '#10b981';

        return `
        <div class="test-card ${isFail ? 'fail' : 'pass'}" id="test-${idx}">
          <div class="test-header" onclick="toggleDetails(${idx})">
            <div class="test-status">
              <span class="status-dot" style="background: ${isFail ? '#ef4444' : '#10b981'}"></span>
              <span class="test-id">[${r.testId}]</span>
              <span class="test-title">${escapeHtml(r.title)}</span>
            </div>
            <div class="test-badges">
              <span class="badge" style="background: ${badgeColor}22; color: ${badgeColor}; border: 1px solid ${badgeColor}44;">
                ${r.severity}
              </span>
              <span class="badge ${r.status.toLowerCase()}">${r.status}</span>
              <span class="chevron">▼</span>
            </div>
          </div>
          <div class="test-body" id="body-${idx}">
            <p class="summary-text"><strong>Summary:</strong> ${escapeHtml(r.summary)}</p>
            ${r.details ? `<div class="details-box"><strong>Details:</strong> ${escapeHtml(r.details)}</div>` : ''}
            ${
              r.curlReproduction
                ? `
              <div class="code-section">
                <div class="code-header">
                  <span>Microsecond Reproduction cURL Burst</span>
                  <button class="copy-btn" onclick="copyText('curl-${idx}')">Copy cURL</button>
                </div>
                <pre id="curl-${idx}"><code>${escapeHtml(r.curlReproduction)}</code></pre>
              </div>`
                : ''
            }
            ${
              r.failingFile
                ? `
              <div class="code-section">
                <div class="code-header">
                  <span>Failing Location: <code>${escapeHtml(r.failingFile)}${r.lineNumber ? `:${r.lineNumber}` : ''}</code></span>
                </div>
                ${r.rootCause ? `<p class="root-cause"><strong>Root Cause:</strong> ${escapeHtml(r.rootCause)}</p>` : ''}
                ${r.suggestedFix ? `<p class="suggested-fix"><strong>Suggested Fix:</strong> ${escapeHtml(r.suggestedFix)}</p>` : ''}
              </div>`
                : ''
            }
            ${
              r.aiPrompt
                ? `
              <div class="code-section">
                <div class="code-header">
                  <span>AI Remediation Prompt</span>
                  <button class="copy-btn" onclick="copyText('prompt-${idx}')">Copy Prompt</button>
                </div>
                <pre id="prompt-${idx}"><code>${escapeHtml(r.aiPrompt)}</code></pre>
              </div>`
                : ''
            }
          </div>
        </div>
      `;
      })
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acidtest Report — ${escapeHtml(report.module.toUpperCase())} (${report.timestamp})</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --card-border: #1f2937;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --accent: #6366f1;
      --danger: #ef4444;
      --success: #10b981;
      --warning: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 2rem; line-height: 1.5; }
    .container { max-width: 1100px; margin: 0 auto; }
    header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--card-border); padding-bottom: 1.5rem; margin-bottom: 2rem; }
    .brand { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.05em; background: linear-gradient(135deg, #a5b4fc, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .meta-tag { font-size: 0.85rem; color: var(--text-muted); }
    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; margin-bottom: 2.5rem; }
    .stat-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; padding: 1.5rem; }
    .stat-title { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.5rem; }
    .stat-value { font-size: 2rem; font-weight: 800; }
    .badge { padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }
    .badge.pass { background: #10b98122; color: #10b981; border: 1px solid #10b98144; }
    .badge.fail { background: #ef444422; color: #ef4444; border: 1px solid #ef444444; }
    .badge.warn { background: #f59e0b22; color: #f59e0b; border: 1px solid #f59e0b44; }
    .filter-bar { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
    .filter-btn { background: var(--card-bg); border: 1px solid var(--card-border); color: var(--text-muted); padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.875rem; }
    .filter-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
    .test-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 10px; margin-bottom: 1rem; overflow: hidden; }
    .test-card.fail { border-left: 4px solid var(--danger); }
    .test-card.pass { border-left: 4px solid var(--success); }
    .test-header { padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none; }
    .test-status { display: flex; align-items: center; gap: 0.75rem; font-weight: 600; font-size: 0.95rem; }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .test-id { color: var(--text-muted); font-family: monospace; font-size: 0.85rem; }
    .test-badges { display: flex; align-items: center; gap: 0.5rem; }
    .test-body { padding: 1.25rem; border-top: 1px solid var(--card-border); background: #0c1220; display: block; }
    .code-section { margin-top: 1rem; background: #050811; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden; }
    .code-header { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 1rem; background: #0f172a; font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
    .copy-btn { background: #1e293b; border: 1px solid #334155; color: #cbd5e1; border-radius: 4px; padding: 0.2rem 0.5rem; font-size: 0.75rem; cursor: pointer; }
    .copy-btn:hover { background: #334155; }
    pre { padding: 1rem; overflow-x: auto; font-family: monospace; font-size: 0.85rem; color: #a5f3fc; }
    .root-cause, .suggested-fix { padding: 0.75rem 1rem; font-size: 0.875rem; }
    .suggested-fix { color: #86efac; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <div class="brand">ACIDTEST • AUDIT REPORT</div>
        <div class="meta-tag">Target: <strong>${escapeHtml(report.target)}</strong> | Module: <strong>${escapeHtml(report.module)}</strong> | Provider: <strong>${escapeHtml(report.provider)}</strong></div>
      </div>
      <div class="meta-tag">Generated: ${escapeHtml(report.timestamp)}</div>
    </header>

    <div class="dashboard-grid">
      <div class="stat-card">
        <div class="stat-title">System Health Grade</div>
        <div class="stat-value" style="color: ${gradeColor};">${report.healthGrade} <span style="font-size: 1rem; color: var(--text-muted); font-weight: 400;">(${report.healthScore}/100)</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Monthly Financial Exposure</div>
        <div class="stat-value" style="color: #ef4444;">$${report.totalRiskUsd.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Invariants Tested</div>
        <div class="stat-value">${totalCount} <span style="font-size: 1rem; color: #10b981;">(${passedCount} Passed, ${failedCount} Failed)</span></div>
      </div>
    </div>

    <div class="filter-bar">
      <button class="filter-btn active" onclick="filterCards('all')">All Invariants (${totalCount})</button>
      <button class="filter-btn" onclick="filterCards('fail')">Failures (${failedCount})</button>
      <button class="filter-btn" onclick="filterCards('pass')">Passed (${passedCount})</button>
    </div>

    <div class="test-list">
      ${resultsHtml}
    </div>
  </div>

  <script>
    function toggleDetails(idx) {
      const el = document.getElementById('body-' + idx);
      el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }

    function filterCards(type) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');

      document.querySelectorAll('.test-card').forEach(card => {
        if (type === 'all') card.style.display = 'block';
        else if (type === 'fail') card.style.display = card.classList.contains('fail') ? 'block' : 'none';
        else if (type === 'pass') card.style.display = card.classList.contains('pass') ? 'block' : 'none';
      });
    }

    function copyText(id) {
      const code = document.getElementById(id).innerText;
      navigator.clipboard.writeText(code).then(() => {
        alert('Copied to clipboard!');
      });
    }
  </script>
</body>
</html>`;
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
