import { describe, it, expect } from 'vitest';
import { safeTruncate, formatMoney, formatMs, renderBar, getHealthColor } from '../src/tui/theme.js';
import { getAllDomainSuites } from '../src/tui/suite-factory.js';
import { exportPromptToFile } from '../src/tui/export-prompt.js';
import { exportHtmlAuditReport } from '../src/tui/export-html.js';
import { ScreenBuffer } from '../src/tui/buffer.js';
import { BRAND_GRADIENT_LUT, getGradientAnsi } from '../src/brand/palette.js';

describe('Acidtest Stage-Based Drill-Down TUI Suite', () => {
  it('safeTruncate clamps text with ellipsis accurately', () => {
    expect(safeTruncate('Concurrent Webhook Burst Idempotency Guard', 20)).toBe('Concurrent Webhook …');
    expect(safeTruncate('Short', 10)).toBe('Short');
    expect(safeTruncate(null, 10)).toBe('');
  });

  it('formats currency, millisecond durations, and progress bars', () => {
    expect(formatMoney(58500)).toBe('$58,500');
    expect(formatMs(0.42)).toBe('420μs');
    expect(formatMs(42)).toBe('42ms');
    expect(formatMs(1500)).toBe('1.50s');

    const bar = renderBar(5, 10, 10);
    expect(bar).toBe('█████░░░░░');
  });

  it('computes correct health grade colors', () => {
    expect(getHealthColor(95)).toBe('green');
    expect(getHealthColor(75)).toBe('yellow');
    expect(getHealthColor(30)).toBe('red');
  });

  it('instantiates all 8 domain suites with 35 total invariants', () => {
    const suites = getAllDomainSuites();
    expect(suites.length).toBe(8);
    const totalTests = suites.reduce((acc, s) => acc + s.tests.length, 0);
    expect(totalTests).toBe(35);
  });

  it('exports AI remediation prompt markdown cleanly', () => {
    const exported = exportPromptToFile({
      testId: 'ACID-TEST-001',
      testName: 'Test Invariant',
      category: 'billing',
      provider: 'stripe',
      severity: 'CRITICAL',
      status: 'FAIL',
      durationMs: 15,
      title: 'Sample Invariant',
      summary: 'Sample violation detected',
      failingFile: 'app/api/route.ts',
      lineNumber: 10,
      rootCause: 'Missing atomic tx',
      suggestedFix: 'Use BEGIN/COMMIT',
    });
    expect(exported).toBe(true);
  });

  it('exports standalone HTML audit report correctly', () => {
    const reportPath = exportHtmlAuditReport(
      [
        {
          testId: 'ACID-BILLING-001',
          testName: 'Concurrent Webhook Burst',
          category: 'billing',
          provider: 'stripe',
          severity: 'CRITICAL',
          status: 'FAIL',
          durationMs: 42,
          title: 'Concurrent Webhook Burst',
          summary: 'Duplicate burst test',
        },
      ],
      'http://localhost:3000'
    );
    expect(reportPath).not.toBeNull();
    expect(reportPath).toContain('.html');
  });

  it('ScreenBuffer supports in-place cell mutation and differential diffing', () => {
    const buffer = new ScreenBuffer(80, 24);
    buffer.drawText(0, 0, 'Acidtest');
    expect(buffer.cols).toBe(80);
    expect(buffer.rows).toBe(24);

    // Reusing cells on clear without re-allocating
    buffer.clear();
    buffer.drawText(2, 2, 'Zero Lag');
    expect(buffer.drawText(2, 2, 'Zero Lag')).toBe(8);
  });

  it('BRAND_GRADIENT_LUT precomputes 256 ANSI color codes', () => {
    expect(BRAND_GRADIENT_LUT.length).toBe(256);
    expect(getGradientAnsi(0)).toBe(BRAND_GRADIENT_LUT[0]);
    expect(getGradientAnsi(1)).toBe(BRAND_GRADIENT_LUT[255]);
    expect(getGradientAnsi(0.5)).toBe(BRAND_GRADIENT_LUT[127]);
  });
});
