export const HTML_REPORT_STYLES = `
  :root {
    --bg: #090d16;
    --card: #111827;
    --border: #1f2937;
    --text: #f9fafb;
    --text-dim: #9ca3af;
    --cyan: #06b6d4;
    --green: #10b981;
    --red: #ef4444;
    --yellow: #f59e0b;
  }
  body {
    margin: 0;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
    background-color: var(--bg);
    color: var(--text);
  }
  .container { max-width: 1100px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 1.5rem; margin-bottom: 2rem; }
  .title-group h1 { margin: 0 0 0.25rem 0; font-size: 1.75rem; letter-spacing: -0.025em; }
  .title-group p { margin: 0; color: var(--text-dim); font-size: 0.9rem; }
  .grade-badge { font-size: 1.5rem; font-weight: 800; padding: 0.5rem 1.25rem; border-radius: 0.5rem; border: 1px solid currentColor; }
  .grade-A { color: var(--green); background: rgba(16, 185, 129, 0.1); }
  .grade-B { color: var(--cyan); background: rgba(6, 182, 212, 0.1); }
  .grade-C { color: var(--yellow); background: rgba(245, 158, 11, 0.1); }
  .grade-CRITICAL, .grade-D { color: var(--red); background: rgba(239, 68, 68, 0.1); }
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .kpi-card { background: var(--card); border: 1px solid var(--border); border-radius: 0.5rem; padding: 1.25rem; }
  .kpi-title { font-size: 0.8rem; text-transform: uppercase; color: var(--text-dim); letter-spacing: 0.05em; margin-bottom: 0.5rem; }
  .kpi-val { font-size: 1.75rem; font-weight: 700; color: var(--text); }
  .section-title { font-size: 1.25rem; margin: 2rem 0 1rem 0; }
  .test-table { width: 100%; border-collapse: collapse; background: var(--card); border: 1px solid var(--border); border-radius: 0.5rem; overflow: hidden; }
  .test-table th, .test-table td { padding: 0.875rem 1rem; text-align: left; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
  .test-table th { background: rgba(255,255,255,0.02); color: var(--text-dim); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .status-tag { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 0.25rem; font-weight: 600; font-size: 0.75rem; }
  .status-PASS { color: var(--green); background: rgba(16, 185, 129, 0.15); }
  .status-FAIL { color: var(--red); background: rgba(239, 68, 68, 0.15); }
  .status-WARN { color: var(--yellow); background: rgba(245, 158, 11, 0.15); }
  .severity-CRITICAL { color: var(--red); font-weight: 700; }
  .code-block { background: #040711; border: 1px solid var(--border); border-radius: 0.375rem; padding: 0.75rem; font-family: monospace; font-size: 0.8rem; overflow-x: auto; color: #a5b4fc; margin-top: 0.5rem; }
  .footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--border); color: var(--text-dim); font-size: 0.8rem; text-align: center; }
`;
