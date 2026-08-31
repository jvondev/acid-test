export const STUDIO_SCRIPTS = `
  let currentReport = null;

  async function triggerAudit() {
    const btn = document.getElementById('btnRun');
    const logs = document.getElementById('auditLogs');
    btn.innerText = '⚡ Auditing Invariants...';
    btn.disabled = true;
    logs.innerText += '\\n[' + new Date().toLocaleTimeString() + '] Dispatching adversarial microsecond burst matrix...\\n';

    try {
      const res = await fetch('/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      currentReport = data;
      renderReport(data);
      logs.innerText += '[' + new Date().toLocaleTimeString() + '] Audit completed. Health Score: ' + data.healthScore + '/100\\n';
    } catch (err) {
      logs.innerText += '[' + new Date().toLocaleTimeString() + '] ERROR: ' + err.message + '\\n';
    } finally {
      btn.innerText = '⚡ Trigger Adversarial Audit';
      btn.disabled = false;
    }
  }

  function renderReport(report) {
    document.getElementById('healthScoreVal').innerText = report.healthGrade + ' (' + report.healthScore + ')';
    document.getElementById('riskExposureVal').innerText = '$' + (report.totalRiskUsd || 0).toLocaleString();
    document.getElementById('invariantsTestedVal').innerText = report.invariantsTested;
    document.getElementById('passedFailedVal').innerText = report.invariantsPassed + ' / ' + report.invariantsFailed;

    const list = document.getElementById('invariantList');
    list.innerHTML = '';
    for (const r of report.results) {
      const div = document.createElement('div');
      div.className = 'test-row';
      div.innerHTML = '<div><strong>' + r.testId + '</strong> - ' + r.title + '<br/><span style="color:var(--text-muted);font-size:0.8rem;">' + r.summary + '</span></div>' +
        '<span class="status-tag status-' + r.status + '">' + r.status + '</span>';
      list.appendChild(div);
    }
  }

  async function copyAiPrompt() {
    try {
      const res = await fetch('/api/remediation');
      const data = await res.json();
      await navigator.clipboard.writeText(data.markdown || '');
      alert('AI Remediation prompt copied to clipboard!');
    } catch {
      alert('Failed to fetch remediation prompt.');
    }
  }

  async function loadInitialData() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.latestReport) renderReport(data.latestReport);
    } catch {}
  }

  window.addEventListener('DOMContentLoaded', loadInitialData);
`;
