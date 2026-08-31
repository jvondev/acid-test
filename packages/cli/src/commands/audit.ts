import pc from 'picocolors';
import { TestRunner, TerminalReporter, type AuditReport } from '@acidtest/core';
import { createBillingSuite } from '@acidtest/billing';
import { createDbSuite } from '@acidtest/db';
import { createAuthSuite } from '@acidtest/auth';
import { createQueueSuite } from '@acidtest/queue';
import { createWebhookSuite } from '@acidtest/webhook';
import { createAiSuite } from '@acidtest/ai';
import { createEmailSuite } from '@acidtest/email';
import { createStorageSuite } from '@acidtest/storage';

export interface AuditOptions {
  url?: string;
  db?: string;
  redis?: string;
  secret?: string;
  concurrency?: string;
  jitter?: string;
  gmv?: string;
  ticketSize?: string;
  ci?: boolean;
}

export async function runAudit(modules: string[], options: AuditOptions): Promise<number> {
  const targetUrl = options.url || 'http://localhost:3000';
  const concurrency = options.concurrency ? parseInt(options.concurrency, 10) : 10;
  const jitterMs = options.jitter ? parseInt(options.jitter, 10) : 5;
  const gmv = options.gmv ? parseFloat(options.gmv) : undefined;
  const ticketSize = options.ticketSize ? parseFloat(options.ticketSize) : undefined;

  console.log(pc.bold(pc.cyan(`\n⚡ Initializing Acidtest Adversarial Audit Suite against ${targetUrl}...`)));

  // Pre-flight probe
  const probe = await TestRunner.probeTarget(targetUrl);
  if (probe.reachable) {
    console.log(pc.green(`✓ Target connected (Latency: ${probe.latencyMs}ms, Server: ${probe.serverSoftware || 'Node.js/HTTP'})`));
  } else {
    console.log(pc.yellow(`⚠ Target unreachable at ${targetUrl}. Running in simulated invariant mode.`));
  }

  const allSuites = [
    createBillingSuite(),
    createDbSuite(),
    createAuthSuite(),
    createQueueSuite(),
    createWebhookSuite(),
    createAiSuite(),
    createEmailSuite(),
    createStorageSuite(),
  ];

  const suitesToRun = modules.length > 0
    ? allSuites.filter((s) => modules.includes(s.category))
    : allSuites;

  let hasCriticalOrHighFailures = false;
  const reports: AuditReport[] = [];

  for (const suite of suitesToRun) {
    process.stdout.write(pc.dim(`  Running [${suite.name}]... `));
    const report = await TestRunner.runSuite(suite, {
      targetUrl,
      dbUrl: options.db,
      redisUrl: options.redis,
      webhookSecret: options.secret,
      concurrency,
      jitterMs,
      gmv,
      ticketSize,
    });

    reports.push(report);
    const passed = report.invariantsPassed;
    const total = report.invariantsTested;

    if (report.invariantsFailed > 0) {
      console.log(pc.red(`FAILED (${passed}/${total} passed)`));
      hasCriticalOrHighFailures = true;
    } else {
      console.log(pc.green(`PASSED (${passed}/${total} passed)`));
    }
  }

  console.log('\n');
  for (const report of reports) {
    console.log(TerminalReporter.format(report));
    console.log('\n');
  }

  if (options.ci && hasCriticalOrHighFailures) {
    return 1;
  }
  return 0;
}
