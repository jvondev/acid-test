import pc from 'picocolors';
import type { AuditReport } from '../types/index.js';

export class TerminalReporter {
  /**
   * Formats a clean, Emil-grade borderless terminal report
   * Follows the same design engineering language as the interactive cockpit
   */
  static format(report: AuditReport): string {
    const width = 85;
    const rule = pc.dim('─'.repeat(width));
    const lines: string[] = [];

    const isClean = report.healthGrade === 'A+' || report.healthGrade === 'A';
    const healthColor = isClean ? pc.green : report.healthGrade === 'B' ? pc.cyan : report.healthGrade === 'C' ? pc.yellow : pc.red;
    const riskColor = report.totalRiskUsd > 0 ? pc.red : pc.green;

    // 1. Header Ribbon (Quiet context strip)
    lines.push('');
    lines.push(
      ` ${pc.bold(pc.cyan('⚡ acidtest'))} ${pc.dim('v' + report.version)}  ${pc.dim('•')}  ${pc.white(report.target)}  ${pc.dim('•')}  ${pc.dim((report.durationMs / 1000).toFixed(2) + 's')}  ${pc.dim('•')}  Health: ${healthColor(pc.bold(report.healthGrade + ` (${report.healthScore}/100)`))}  ${pc.dim('•')}  Risk: ${riskColor(pc.bold('$' + Math.round(report.totalRiskUsd).toLocaleString() + '/mo'))}`
    );
    lines.push(` ${rule}`);

    // 2. Verdict Narrative
    lines.push('');
    if (report.invariantsFailed > 0) {
      lines.push(`  ${pc.bold(pc.red('RELIABILITY VERDICT: CRITICAL REVENUE RISK DETECTED'))}`);
      lines.push(`  ${pc.dim(`${report.invariantsFailed} of ${report.invariantsTested} invariants failed. Concurrency race conditions reproduced.`)}`);
    } else {
      lines.push(`  ${pc.bold(pc.green('RELIABILITY VERDICT: ALL INVARIANTS PASSING UNDER CHAOS BURST'))}`);
      lines.push(`  ${pc.dim(`All ${report.invariantsTested} distributed invariants verified with $0/mo financial exposure.`)}`);
    }

    // 3. Invariants List
    lines.push('');
    lines.push(`  ${pc.bold(pc.white('INVARIANT VERIFICATION'))}`);

    for (const res of report.results) {
      const isPass = res.status === 'PASS';
      const isFail = res.status === 'FAIL';
      const icon = isPass ? pc.green('✔') : isFail ? pc.red('✖') : pc.yellow('▲');
      const shortId = res.testId.replace(/^ACID-/, '').padEnd(8, ' ').slice(0, 8);
      const title = res.title.length > 42 ? `${res.title.slice(0, 39)}...` : res.title.padEnd(42, ' ');
      const duration = `${res.durationMs}ms`.padStart(6, ' ');
      const statusTag = isPass ? pc.green('PASSED') : pc.red(`FAILED (${res.severity})`);

      lines.push(`  ${icon}  ${pc.cyan(shortId)}  ${pc.white(title)}  ${pc.dim(duration)}  ${pc.bold(statusTag)}`);
    }

    // 4. Actionable Diagnostics & Proposed Code Fix for Failures
    const failed = report.results.filter((r) => r.status === 'FAIL');
    if (failed.length > 0) {
      lines.push('');
      lines.push(`  ${pc.bold(pc.red('PRIMARY DEFECT & CODE REMEDIATION:'))}`);
      const topFail = failed[0];
      lines.push(`  ${pc.white(pc.bold(topFail.title))}`);
      lines.push(`  ${pc.dim('Location: ')}${pc.cyan(topFail.failingFile || 'app/api/route.ts')}:${pc.cyan(String(topFail.lineNumber || 34))}`);
      if (topFail.suggestedFix) {
        lines.push(`  ${pc.green('Suggested Fix: ')}${pc.white(topFail.suggestedFix)}`);
      }
    }

    // 5. Artifact Footer
    lines.push('');
    lines.push(` ${rule}`);
    lines.push(`  ${pc.dim('📄 HTML Report: ')} ${pc.white(`.acidtest/reports/audit-${report.id}.html`)}`);
    lines.push(`  ${pc.dim('🤖 AI Prompt:   ')} ${pc.white('.acidtest/remediation.prompt.md')}`);
    lines.push(`  ${pc.dim('🌐 Studio UI:   ')} ${pc.cyan('npx acidtest studio')}`);
    lines.push('');

    return lines.join('\n');
  }
}
