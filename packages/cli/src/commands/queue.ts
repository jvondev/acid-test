import pc from 'picocolors';
import { TestRunner, TerminalReporter } from '@acid-test/core';
import { createQueueSuite } from '@acid-test/queue';
import type { AuditOptions } from './audit.js';

export async function runQueueCommand(options: AuditOptions & { provider?: string }): Promise<number> {
  const provider = options.provider || 'bullmq';
  const suite = createQueueSuite(provider);

  console.log(pc.bold(pc.cyan(`\n⚡ Launching Acidtest Distributed Queue Chaos Auditor (${provider.toUpperCase()})...`)));
  const report = await TestRunner.runSuite(suite, {
    targetUrl: options.url || 'http://localhost:3000/api/jobs',
    redisUrl: options.redis,
    concurrency: options.concurrency ? parseInt(options.concurrency, 10) : 10,
    gmv: options.gmv ? parseFloat(options.gmv) : undefined,
  });

  console.log('\n' + TerminalReporter.format(report) + '\n');
  return options.ci && report.invariantsFailed > 0 ? 1 : 0;
}
