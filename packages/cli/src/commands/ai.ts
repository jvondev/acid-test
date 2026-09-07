import pc from 'picocolors';
import { TestRunner, TerminalReporter } from '@acid-test/core';
import { createAiSuite } from '@acid-test/ai';
import type { AuditOptions } from './audit.js';

export async function runAiCommand(options: AuditOptions & { provider?: string }): Promise<number> {
  const provider = options.provider || 'openai';
  const suite = createAiSuite(provider);

  console.log(pc.bold(pc.cyan(`\n⚡ Launching Acid-test AI Gateway & Streaming Resiliency Auditor (${provider.toUpperCase()})...`)));
  const report = await TestRunner.runSuite(suite, {
    targetUrl: options.url || 'http://localhost:3000/api/chat',
    concurrency: options.concurrency ? parseInt(options.concurrency, 10) : 10,
    gmv: options.gmv ? parseFloat(options.gmv) : undefined,
  });

  console.log('\n' + TerminalReporter.format(report) + '\n');
  return options.ci && report.invariantsFailed > 0 ? 1 : 0;
}
