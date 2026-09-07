import fs from 'node:fs';
import path from 'node:path';
import type { AuditReport, AiRemediationIssue } from '../types/index.js';

export class AiRemediationExporter {
  /**
   * Generates machine-readable AI remediation JSON and markdown fix prompt
   */
  static exportRemediation(
    report: AuditReport,
    outputDir: string = '.acid-test'
  ): { jsonPath: string; promptPath: string; htmlPath: string } {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const reportsDir = path.join(outputDir, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const failed = report.results.filter((r) => r.status === 'FAIL');

    const issues: AiRemediationIssue[] = failed.map((f) => ({
      id: f.testId,
      severity: f.severity,
      title: f.title,
      failingFile: f.failingFile || 'src/server.ts',
      lineNumber: f.lineNumber,
      reproductionCommand: f.curlReproduction || `npx @acid-test/cli ${report.module} --target ${report.target}`,
      rootCause: f.rootCause || f.summary,
      suggestedFix: f.suggestedFix,
      aiPrompt: f.aiPrompt || `Refactor ${f.failingFile || 'handler'} to satisfy ACID invariant: ${f.title}.`,
    }));

    const remediationJson = {
      version: '1.0',
      audit_timestamp: report.timestamp,
      target: report.target,
      module: report.module,
      provider: report.provider,
      health_score: report.healthScore,
      health_grade: report.healthGrade,
      estimated_monthly_loss_usd: report.totalRiskUsd,
      issues,
    };

    const jsonPath = path.join(outputDir, 'remediation.json');
    fs.writeFileSync(jsonPath, JSON.stringify(remediationJson, null, 2), 'utf8');

    // Generate Markdown prompt
    const promptLines: string[] = [];
    promptLines.push(`# Acid-test AI Remediation Prompt`);
    promptLines.push(`> **Audit Target:** \`${report.target}\` | **Health Grade:** \`${report.healthGrade}\` | **Financial Exposure:** \`$${report.totalRiskUsd}/mo\``);
    promptLines.push(``);
    promptLines.push(`You are an expert distributed systems engineer. An automated ACID audit detected ${issues.length} critical reliability and security defect(s).`);
    promptLines.push(`Please fix the following issues in the codebase:`);
    promptLines.push(``);

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      promptLines.push(`### Issue ${i + 1}: [${issue.id}] ${issue.title} (${issue.severity})`);
      promptLines.push(`* **Failing File:** \`${issue.failingFile}${issue.lineNumber ? `:${issue.lineNumber}` : ''}\``);
      promptLines.push(`* **Root Cause:** ${issue.rootCause}`);
      promptLines.push(`* **Suggested Fix:** ${issue.suggestedFix}`);
      if (issue.reproductionCommand) {
        promptLines.push(`* **Reproduction Command:**`);
        promptLines.push('```bash');
        promptLines.push(issue.reproductionCommand);
        promptLines.push('```');
      }
      promptLines.push(`* **Remediation Task:**`);
      promptLines.push(issue.aiPrompt || '');
      promptLines.push(``);
    }

    const promptPath = path.join(outputDir, 'remediation.prompt.md');
    fs.writeFileSync(promptPath, promptLines.join('\n'), 'utf8');

    const htmlPath = path.join(reportsDir, `audit-${report.id}.html`);

    return {
      jsonPath,
      promptPath,
      htmlPath,
    };
  }
}
