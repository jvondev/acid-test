import pc from 'picocolors';
import { TestRunner, TerminalReporter } from '@acidtest/core';
import { createStorageSuite } from '@acidtest/storage';
import type { AuditOptions } from './audit.js';

export async function runStorageCommand(options: AuditOptions & { provider?: string }): Promise<number> {
  const provider = options.provider || 's3';
  const suite = createStorageSuite(provider);

  console.log(pc.bold(pc.cyan(`\n⚡ Launching Acidtest Object Storage & Blob Security Auditor (${provider.toUpperCase()})...`)));
  const report = await TestRunner.runSuite(suite, {
    targetUrl: options.url || 'http://localhost:3000/api/storage',
    concurrency: options.concurrency ? parseInt(options.concurrency, 10) : 10,
    gmv: options.gmv ? parseFloat(options.gmv) : undefined,
  });

  console.log('\n' + TerminalReporter.format(report) + '\n');
  return options.ci && report.invariantsFailed > 0 ? 1 : 0;
}
