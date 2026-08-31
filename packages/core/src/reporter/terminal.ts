import pc from 'picocolors';
import type { AuditReport, InvariantResult } from '../types/index.js';

export class TerminalReporter {
  /**
   * Formats a complete visual terminal report card
   */
  static format(report: AuditReport): string {
    const width = 78;
    const border = '─'.repeat(width - 2);

    const gradeColor =
      report.healthGrade === 'A+' || report.healthGrade === 'A'
        ? pc.green
        : report.healthGrade === 'B'
        ? pc.cyan
        : report.healthGrade === 'C'
        ? pc.yellow
        : pc.red;

    const gradeBadge =
      report.healthGrade === 'A+' || report.healthGrade === 'A'
        ? pc.green(`🟢 CLEAN (Score: ${report.healthScore}/100)`)
        : report.healthGrade === 'B'
        ? pc.cyan(`🔵 LOW RISK (Score: ${report.healthScore}/100)`)
        : report.healthGrade === 'C'
        ? pc.yellow(`🟡 MEDIUM RISK (Score: ${report.healthScore}/100)`)
        : report.healthGrade === 'D'
        ? pc.magenta(`🟠 HIGH RISK (Score: ${report.healthScore}/100)`)
        : pc.red(`🔴 CRITICAL RISK (Score: ${report.healthScore}/100)`);

    const lines: string[] = [];

    lines.push(pc.cyan(`┌${border}┐`));
    lines.push(
      pc.cyan(`│ `) +
        pc.bold(pc.white(`ACIDTEST v${report.version} • SYSTEM INTEGRITY & ACID AUDIT REPORT`)).padEnd(width + 8) +
        pc.cyan(`│`)
    );
    lines.push(pc.cyan(`├${border}┤`));
    lines.push(
      pc.cyan(`│ `) +
        pc.dim(`Target: `) +
        pc.bold(report.target) +
        pc.dim(` • Module: `) +
        pc.bold(report.module.toUpperCase()) +
        pc.dim(` • Provider: `) +
        pc.bold(report.provider).padEnd(width + 10) +
        pc.cyan(`│`)
    );
    lines.push(
      pc.cyan(`│ `) +
        pc.dim(`Timestamp: `) +
        pc.white(report.timestamp) +
        pc.dim(` • Duration: `) +
        pc.white(`${(report.durationMs / 1000).toFixed(2)}s`).padEnd(width + 8) +
        pc.cyan(`│`)
    );
    lines.push(pc.cyan(`├${border}┤`));
    lines.push(pc.cyan(`│ `) + pc.bold(`OVERALL HEALTH GRADE: `) + gradeBadge.padEnd(width + 8) + pc.cyan(`│`));
    lines.push(
      pc.cyan(`│ `) +
        pc.bold(`ESTIMATED FINANCIAL EXPOSURE: `) +
        pc.red(pc.bold(`$${report.totalRiskUsd.toLocaleString()} / month`)).padEnd(width + 12) +
        pc.cyan(`│`)
    );
    lines.push(pc.cyan(`│ `) + ''.padEnd(width - 2) + pc.cyan(`│`));

    lines.push(pc.cyan(`│ `) + pc.bold(pc.underline('INVARIANT TEST RESULTS:')) + ''.padEnd(width - 25) + pc.cyan(`│`));

    for (const res of report.results) {
      const statusIcon =
        res.status === 'PASS'
          ? pc.green('✓')
          : res.status === 'FAIL'
          ? pc.red('✖')
          : res.status === 'WARN'
          ? pc.yellow('⚠')
          : pc.dim('○');

      const title = res.title.length > 50 ? `${res.title.slice(0, 47)}...` : res.title;
      const statusText =
        res.status === 'PASS'
          ? pc.green('PASSED')
          : res.status === 'FAIL'
          ? pc.red(`FAILED (${res.severity})`)
          : pc.yellow('WARN');

      const entry = `  ${statusIcon} [${res.testId}] ${title}: ${statusText}`;
      lines.push(pc.cyan(`│ `) + entry.padEnd(width + 10) + pc.cyan(`│`));
    }

    const failed = report.results.filter((r) => r.status === 'FAIL');
    if (failed.length > 0) {
      lines.push(pc.cyan(`│ `) + ''.padEnd(width - 2) + pc.cyan(`│`));
      lines.push(pc.cyan(`│ `) + pc.bold(pc.red('TOP DEFECTS & ROOT CAUSES:')) + ''.padEnd(width - 28) + pc.cyan(`│`));

      for (let i = 0; i < Math.min(failed.length, 3); i++) {
        const f = failed[i];
        lines.push(
          pc.cyan(`│ `) +
            pc.red(`  ${i + 1}. [${f.category.toUpperCase()}] `) +
            pc.white(f.title.slice(0, 48)).padEnd(width + 8) +
            pc.cyan(`│`)
        );
        if (f.failingFile) {
          lines.push(
            pc.cyan(`│ `) +
              pc.dim(`     File: ${f.failingFile}${f.lineNumber ? `:${f.lineNumber}` : ''}`).padEnd(width + 8) +
              pc.cyan(`│`)
          );
        }
        if (f.suggestedFix) {
          lines.push(
            pc.cyan(`│ `) +
              pc.yellow(`     Fix: `) +
              pc.dim(f.suggestedFix.slice(0, 58)).padEnd(width + 8) +
              pc.cyan(`│`)
          );
        }
      }
    }

    lines.push(pc.cyan(`│ `) + ''.padEnd(width - 2) + pc.cyan(`│`));
    lines.push(
      pc.cyan(`│ `) +
        pc.green(`📄 Full HTML Report: `) +
        pc.white(`.acidtest/reports/audit-${report.id}.html`).padEnd(width + 8) +
        pc.cyan(`│`)
    );
    lines.push(
      pc.cyan(`│ `) +
        pc.magenta(`🤖 AI Fix Prompt:    `) +
        pc.white(`.acidtest/remediation.prompt.md`).padEnd(width + 8) +
        pc.cyan(`│`)
    );
    lines.push(
      pc.cyan(`│ `) +
        pc.blue(`🌐 Open Studio:      `) +
        pc.white(`npx @acidtest/cli studio`).padEnd(width + 8) +
        pc.cyan(`│`)
    );
    lines.push(pc.cyan(`└${border}┘`));

    return lines.join('\n');
  }
}
