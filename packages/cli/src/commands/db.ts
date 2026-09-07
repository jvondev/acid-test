import pc from 'picocolors';
import { TestRunner, TerminalReporter } from '@acid-test/core';
import { createDbSuite } from '@acid-test/db';
import type { AuditOptions } from './audit.js';

export async function runDbCommand(options: AuditOptions & { provider?: string }): Promise<number> {
  const provider = options.provider || 'postgresql';
  const suite = createDbSuite(provider);

  console.log(pc.bold(pc.cyan(`\n⚡ Launching Acid-test Database & RLS Isolation Auditor (${provider.toUpperCase()})...`)));
  const report = await TestRunner.runSuite(suite, {
    dbUrl: options.db,
    concurrency: options.concurrency ? parseInt(options.concurrency, 10) : 10,
    gmv: options.gmv ? parseFloat(options.gmv) : undefined,
    ticketSize: options.ticketSize ? parseFloat(options.ticketSize) : undefined,
  });

  console.log('\n' + TerminalReporter.format(report) + '\n');
  return options.ci && report.invariantsFailed > 0 ? 1 : 0;
}
