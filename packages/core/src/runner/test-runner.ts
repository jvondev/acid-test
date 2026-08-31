import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import type {
  InvariantSuite,
  InvariantTest,
  ExecutionContext,
  InvariantResult,
  AuditReport,
  ProbeResult,
} from '../types/index.js';
import { FinancialRiskCalculator } from '../risk/calculator.js';
import { TerminalReporter } from '../reporter/terminal.js';
import { HtmlReportGenerator } from '../reporter/html.js';
import { AiRemediationExporter } from '../reporter/ai-remediation.js';

export class TestRunner {
  /**
   * Probes a target HTTP URL for reachability, CORS, and response latency
   */
  static async probeTarget(targetUrl: string, timeoutMs = 5000): Promise<ProbeResult> {
    const startTime = process.hrtime.bigint();
    try {
      const parsedUrl = new URL(targetUrl);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      return await new Promise<ProbeResult>((resolve) => {
        const req = client.request(
          {
            protocol: parsedUrl.protocol,
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: `${parsedUrl.pathname}${parsedUrl.search}`,
            method: 'GET',
            timeout: timeoutMs,
          },
          (res) => {
            const endTime = process.hrtime.bigint();
            const latencyMs = Number(endTime - startTime) / 1_000_000;
            const corsHeaders: Record<string, string> = {};

            if (res.headers['access-control-allow-origin']) {
              corsHeaders['access-control-allow-origin'] = String(res.headers['access-control-allow-origin']);
            }

            resolve({
              reachable: true,
              latencyMs: Math.round(latencyMs * 100) / 100,
              statusCode: res.statusCode,
              serverSoftware: (res.headers['server'] as string) || undefined,
              corsHeaders,
            });
          }
        );

        req.on('error', (err) => {
          const endTime = process.hrtime.bigint();
          const latencyMs = Number(endTime - startTime) / 1_000_000;
          resolve({
            reachable: false,
            latencyMs: Math.round(latencyMs * 100) / 100,
            error: err.message,
          });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({
            reachable: false,
            latencyMs: timeoutMs,
            error: `Target probe timed out after ${timeoutMs}ms`,
          });
        });

        req.end();
      });
    } catch (err) {
      return {
        reachable: false,
        latencyMs: 0,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Executes a complete InvariantSuite against a target
   */
  static async runSuite(suite: InvariantSuite, context: ExecutionContext): Promise<AuditReport> {
    const startTime = Date.now();
    const results: InvariantResult[] = [];
    const id = new Date().toISOString().replace(/[:.]/g, '-');

    const totalTests = suite.tests.length;

    for (let i = 0; i < totalTests; i++) {
      const test = suite.tests[i];
      context.onProgress?.({
        completed: i,
        total: totalTests,
        currentTest: test.name,
      });

      const testStartTime = Date.now();
      try {
        const result = await test.run(context);
        results.push(result);
      } catch (err) {
        results.push({
          testId: test.id,
          testName: test.name,
          category: suite.category,
          provider: suite.provider,
          severity: test.severity,
          status: 'FAIL',
          durationMs: Date.now() - testStartTime,
          title: test.name,
          summary: `Unhandled execution error: ${err instanceof Error ? err.message : String(err)}`,
          rootCause: err instanceof Error ? err.stack : undefined,
        });
      }
    }

    context.onProgress?.({
      completed: totalTests,
      total: totalTests,
      currentTest: 'Complete',
    });

    const durationMs = Date.now() - startTime;
    const passedCount = results.filter((r) => r.status === 'PASS').length;
    const failedCount = results.filter((r) => r.status === 'FAIL').length;
    const skippedCount = results.filter((r) => r.status === 'SKIP').length;

    const riskAnalysis = FinancialRiskCalculator.calculate(results, {
      monthlyGmv: context.gmv,
      ticketSize: context.ticketSize,
    });

    const report: AuditReport = {
      version: '1.0.0',
      id,
      timestamp: new Date().toISOString(),
      target: context.targetUrl || context.dbUrl || context.redisUrl || 'localhost',
      module: suite.category,
      provider: suite.provider,
      score: riskAnalysis.scoreStatus,
      healthScore: riskAnalysis.healthScore,
      healthGrade: riskAnalysis.healthGrade,
      financialRiskUsdMonthly: riskAnalysis.estimatedMonthlyLossUsd,
      complianceRiskUsd: riskAnalysis.compliancePenaltyUsd,
      totalRiskUsd: riskAnalysis.totalRiskExposureUsd,
      executiveSummary: riskAnalysis.executiveDiagnosis,
      invariantsTested: totalTests,
      invariantsPassed: passedCount,
      invariantsFailed: failedCount,
      invariantsSkipped: skippedCount,
      durationMs,
      results,
      remediations: [],
    };

    // Export HTML and AI Remediation files
    const exported = AiRemediationExporter.exportRemediation(report);
    const htmlContent = HtmlReportGenerator.generate(report);
    fs.writeFileSync(exported.htmlPath, htmlContent, 'utf8');

    return report;
  }
}
