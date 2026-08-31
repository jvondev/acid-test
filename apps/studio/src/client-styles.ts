export const STUDIO_STYLES = `
  :root {
    --bg-main: #0a0d14;
    --bg-card: #111726;
    --border: #1e293b;
    --text: #f8fafc;
    --text-muted: #94a3b8;
    --cyan: #06b6d4;
    --green: #10b981;
    --red: #ef4444;
    --yellow: #f59e0b;
    --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background-color: var(--bg-main);
    color: var(--text);
  }
  .app-container { display: grid; grid-template-columns: 280px 1fr; min-height: 100vh; }
  .sidebar { background: #07090e; border-right: 1px solid var(--border); padding: 1.5rem; }
  .logo { font-size: 1.25rem; font-weight: 800; color: var(--cyan); letter-spacing: -0.025em; margin-bottom: 2rem; display: flex; align-items: center; gap: 0.5rem; }
  .nav-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.75rem; border-radius: 0.375rem; color: var(--text-muted); text-decoration: none; margin-bottom: 0.25rem; cursor: pointer; }
  .nav-item:hover, .nav-item.active { background: var(--bg-card); color: var(--text); }
  .main-content { padding: 2rem; overflow-y: auto; }
  .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
  .stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 0.5rem; padding: 1.25rem; }
  .stat-title { font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; margin-bottom: 0.5rem; }
  .stat-value { font-size: 1.75rem; font-weight: 700; }
  .run-btn { background: var(--cyan); color: #000; border: none; font-weight: 700; padding: 0.75rem 1.5rem; border-radius: 0.375rem; cursor: pointer; }
  .run-btn:hover { opacity: 0.9; }
  .card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 1.5rem; }
  .card-title { font-size: 1.1rem; font-weight: 600; margin-top: 0; margin-bottom: 1rem; }
  .test-row { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .status-tag { padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 700; }
  .status-PASS { background: rgba(16, 185, 129, 0.2); color: var(--green); }
  .status-FAIL { background: rgba(239, 68, 68, 0.2); color: var(--red); }
  .btn-copy { background: #1e293b; border: 1px solid var(--border); color: #fff; padding: 0.4rem 0.8rem; border-radius: 0.25rem; cursor: pointer; font-size: 0.75rem; }
  .logs-terminal { background: #000; border: 1px solid var(--border); border-radius: 0.375rem; padding: 1rem; font-family: var(--font-mono); font-size: 0.8rem; height: 200px; overflow-y: auto; color: #a5b4fc; }
`;
