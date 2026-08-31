import pc from 'picocolors';
import { TestRunner, TerminalReporter } from '@acidtest/core';
import { createBillingSuite } from '@acidtest/billing';
import type { AuditOptions } from './audit.js';

export async function runBillingCommand(options: AuditOptions & { provider?: string }): Promise<number> {
  const provider = options.provider || 'stripe';
  const suite = createBillingSuite(provider);

  console.log(pc.bold(pc.cyan(`\n⚡ Launching Acidtest Billing Invariant Fuzzer (${provider.toUpperCase()})...`)));
  const report = await TestRunner.runSuite(suite, {
    targetUrl: options.url || 'http://localhost:3000/api/webhooks/stripe',
    dbUrl: options.db,
    webhookSecret: options.secret,
    concurrency: options.concurrency ? parseInt(options.concurrency, 10) : 10,
    jitterMs: options.jitter ? parseInt(options.jitter, 10) : 5,
    gmv: options.gmv ? parseFloat(options.gmv) : undefined,
    ticketSize: options.ticketSize ? parseFloat(options.ticketSize) : undefined,
  });

  console.log('\n' + TerminalReporter.format(report) + '\n');
  return options.ci && report.invariantsFailed > 0 ? 1 : 0;
}
