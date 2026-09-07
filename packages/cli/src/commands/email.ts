import pc from 'picocolors';
import { TestRunner, TerminalReporter } from '@acid-test/core';
import { createEmailSuite } from '@acid-test/email';
import type { AuditOptions } from './audit.js';

export async function runEmailCommand(options: AuditOptions & { provider?: string }): Promise<number> {
  const provider = options.provider || 'resend';
  const suite = createEmailSuite(provider);

  console.log(pc.bold(pc.cyan(`\n⚡ Launching Acid-test Transactional Email & Communication Auditor (${provider.toUpperCase()})...`)));
  const report = await TestRunner.runSuite(suite, {
    targetUrl: options.url || 'http://localhost:3000/api/email',
    concurrency: options.concurrency ? parseInt(options.concurrency, 10) : 10,
    gmv: options.gmv ? parseFloat(options.gmv) : undefined,
  });

  console.log('\n' + TerminalReporter.format(report) + '\n');
  return options.ci && report.invariantsFailed > 0 ? 1 : 0;
}
