import pc from 'picocolors';
import { TestRunner, TerminalReporter, ProjectDetector, type AuditReport, type DetectedDomain } from '@acid-test/core';
import { createBillingSuite } from '@acid-test/billing';
import { createDbSuite } from '@acid-test/db';
import { createAuthSuite } from '@acid-test/auth';
import { createQueueSuite } from '@acid-test/queue';
import { createWebhookSuite } from '@acid-test/webhook';
import { createAiSuite } from '@acid-test/ai';
import { createEmailSuite } from '@acid-test/email';
import { createStorageSuite } from '@acid-test/storage';
import { runDemoCommand } from './demo.js';
import { renderBrandBanner } from '../brand/index.js';

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
  // Fuzzy alias routing: if user ran `acidtest audit demo`, execute demo proving ground
  if (modules.includes('demo') || modules.includes('fuzz')) {
    return runDemoCommand();
  }

  // 1. Run zero-config project discovery
  const discovery = await ProjectDetector.discover(process.cwd());

  // Print Unified Brand Banner with Target Info
  const resolvedTarget = options.url || discovery.liveServer?.url || 'http://localhost:3000';
  const resolvedLatency = discovery.liveServer?.latencyMs || 1.2;

  console.log(renderBrandBanner({
    targetUrl: resolvedTarget,
    latencyMs: resolvedLatency,
    invariantsCount: 24,
  }));

  console.log(pc.bold(`📦 Project Topology & Detected Services:`));
  console.log(`  ${pc.dim('•')} Location:  ${pc.white(discovery.projectRoot)}`);
  if (discovery.projectName) {
    console.log(`  ${pc.dim('•')} App Name:  ${pc.bold(pc.white(discovery.projectName))} (${discovery.framework?.toUpperCase() || 'Node.js'})`);
  }

  if (discovery.detectedServices.length > 0) {
    console.log(`  ${pc.dim('•')} Detected Active Services:`);
    for (const s of discovery.detectedServices) {
      console.log(`    ${pc.green('✔')} ${pc.bold(s.domain.toUpperCase())} [${s.provider}]: ${pc.dim(s.evidence)}`);
    }
  } else {
    console.log(`  ${pc.yellow('ℹ')} ${pc.dim('No specific cloud/database integrations detected in package.json/routes.')}`);
  }

  // 2. Resolve target URL & database URLs
  let targetUrl = options.url;
  if (!targetUrl) {
    if (discovery.liveServer) {
      targetUrl = discovery.liveServer.url;
      console.log(`  ${pc.dim('•')} Live Target: ${pc.green(targetUrl)} ${pc.dim(`(Active dev server probed on port ${discovery.liveServer.port})`)}`);
    } else {
      targetUrl = discovery.envVars['APP_URL'] || discovery.envVars['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000';
      console.log(`  ${pc.dim('•')} Target Server: ${pc.yellow(targetUrl)} ${pc.dim(`(No active server detected on localhost ports. Ensure dev server is running)`)}`);
    }
  } else {
    console.log(`  ${pc.dim('•')} Target Server: ${pc.cyan(targetUrl)}`);
  }

  const dbUrl = options.db || discovery.envVars['DATABASE_URL'] || discovery.envVars['POSTGRES_URL'];
  const redisUrl = options.redis || discovery.envVars['REDIS_URL'] || discovery.envVars['KV_URL'];
  const webhookSecret = options.secret || discovery.envVars['STRIPE_WEBHOOK_SECRET'] || discovery.envVars['SHOPIFY_WEBHOOK_SECRET'];

  const concurrency = options.concurrency ? parseInt(options.concurrency, 10) : 10;
  const jitterMs = options.jitter ? parseInt(options.jitter, 10) : 5;
  const gmv = options.gmv ? parseFloat(options.gmv) : undefined;
  const ticketSize = options.ticketSize ? parseFloat(options.ticketSize) : undefined;

  console.log(pc.dim(`\n───────────────────────────────────────────────────────────────────────────\n`));

  // 3. Determine which suites to run based on auto-discovery
  const allSuites = [
    { domain: 'billing' as DetectedDomain, suite: createBillingSuite() },
    { domain: 'db' as DetectedDomain, suite: createDbSuite() },
    { domain: 'auth' as DetectedDomain, suite: createAuthSuite() },
    { domain: 'queue' as DetectedDomain, suite: createQueueSuite() },
    { domain: 'webhook' as DetectedDomain, suite: createWebhookSuite() },
    { domain: 'ai' as DetectedDomain, suite: createAiSuite() },
    { domain: 'email' as DetectedDomain, suite: createEmailSuite() },
    { domain: 'storage' as DetectedDomain, suite: createStorageSuite() },
  ];

  let suitesToRun: typeof allSuites = [];
  if (modules.length > 0) {
    const validDomains = allSuites.map(s => s.domain);
    const matched = allSuites.filter(s => modules.includes(s.domain));
    if (matched.length === 0) {
      console.log(pc.yellow(`⚠ Unknown module(s): ${modules.join(', ')}`));
      console.log(`Valid modules: ${pc.cyan(validDomains.join(', '))}, or run ${pc.cyan('acidtest demo')}.\n`);
      return 1;
    }
    suitesToRun = matched;
  } else if (discovery.activeDomains.length > 0) {
    suitesToRun = allSuites.filter(s => discovery.activeDomains.includes(s.domain));
    const skipped = discovery.skippedDomains.map(s => s.domain.toUpperCase()).join(', ');
    console.log(pc.dim(`• Auditing ${suitesToRun.length} auto-detected module(s). Skipped unconfigured: ${skipped}\n`));
  } else {
    console.log(pc.yellow(`ℹ No supported backend integrations (Stripe, PostgreSQL, Clerk, BullMQ, etc.) detected in this directory.`));
    console.log(`\nTo run an audit:`);
    console.log(`  1. Run ${pc.cyan('npx @acid-test/cli demo')} to try out live adversarial fuzzing on an in-memory proving ground.`);
    console.log(`  2. Specify a domain command directly (e.g. ${pc.cyan('npx @acid-test/cli billing --url http://localhost:3000/api/webhooks/stripe')}).`);
    console.log(`  3. Run ${pc.cyan('npx @acid-test/cli audit billing db')} to force auditing specific modules.\n`);
    return 0;
  }

  let hasCriticalOrHighFailures = false;
  const reports: AuditReport[] = [];

  for (const { domain, suite } of suitesToRun) {
    process.stdout.write(pc.dim(`  Executing [${suite.name}]... `));
    const report = await TestRunner.runSuite(suite, {
      targetUrl,
      dbUrl,
      redisUrl,
      webhookSecret,
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
