import { STUDIO_STYLES } from './client-styles.js';
import { STUDIO_SCRIPTS } from './client-scripts.js';

export class StudioClientHtml {
  static render(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acidtest Studio • Reliability & Chaos Control</title>
  <style>${STUDIO_STYLES}</style>
</head>
<body>
  <div class="app-container">
    <div class="sidebar">
      <div class="logo">⚡ ACIDTEST STUDIO</div>
      <div class="nav-item active">📊 Dashboard</div>
      <div class="nav-item" onclick="triggerAudit()">⚡ Run Full Audit</div>
      <div class="nav-item" onclick="copyAiPrompt()">🤖 Copy AI Prompt</div>
    </div>
    <div class="main-content">
      <div class="top-bar">
        <div>
          <h1 style="margin:0; font-size:1.5rem;">System Health & Invariant Proving Ground</h1>
          <p style="margin:0; color:var(--text-muted); font-size:0.85rem;">Continuous adversarial chaos testing on localhost:4400</p>
        </div>
        <button id="btnRun" class="run-btn" onclick="triggerAudit()">⚡ Trigger Adversarial Audit</button>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-title">Health Grade</div>
          <div class="stat-value" id="healthScoreVal" style="color:var(--green)">--</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Financial Exposure</div>
          <div class="stat-value" id="riskExposureVal" style="color:var(--yellow)">--</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Invariants Tested</div>
          <div class="stat-value" id="invariantsTestedVal">--</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Passed / Failed</div>
          <div class="stat-value" id="passedFailedVal">--</div>
        </div>
      </div>

      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <h2 class="card-title" style="margin:0;">Active Invariant Checks</h2>
          <button class="btn-copy" onclick="copyAiPrompt()">🤖 Copy AI Fix Prompt</button>
        </div>
        <div id="invariantList">
          <div style="color:var(--text-muted); font-size:0.9rem;">Click "Trigger Adversarial Audit" to execute microsecond burst matrix.</div>
        </div>
      </div>

      <div class="card">
        <h2 class="card-title">Real-Time Execution Logs</h2>
        <div class="logs-terminal" id="auditLogs">[Studio] Ready. Microsecond burst fuzzer initialized.</div>
      </div>
    </div>
  </div>
  <script>${STUDIO_SCRIPTS}</script>
</body>
</html>`;
  }
}

export function renderStudioHtml(): string {
  return StudioClientHtml.render();
}
