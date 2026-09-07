import pc from 'picocolors';
import { SandboxServer, TestRunner, TerminalReporter } from '@acid-test/core';
import { createBillingSuite } from '@acid-test/billing';

export async function runDemoCommand(): Promise<number> {
  const width = 85;
  const rule = pc.dim('─'.repeat(width));

  console.log('');
  console.log(` ${pc.bold(pc.cyan('⚡ ACID-TEST'))} ${pc.bold(pc.white('ADVERSARIAL PROVING GROUND & CHAOS SIMULATION'))}`);
  console.log(` ${pc.dim('Executing real microsecond concurrency bursts against Vulnerable vs Hardened targets')}`);
  console.log(` ${rule}`);

  // 1. Run against Vulnerable sandbox
  console.log(`\n ${pc.bold(pc.red('▶ STEP 1: Auditing Vulnerable Production Target (Race Condition Window)...'))}`);
  const vulnerableServer = new SandboxServer({ port: 4455, mode: 'vulnerable' });
  const vulnPort = await vulnerableServer.start();
  const vulnUrl = `http://localhost:${vulnPort}/api/billing`;

  const suite1 = createBillingSuite('stripe');
  const vulnReport = await TestRunner.runSuite(suite1, {
    targetUrl: vulnUrl,
    concurrency: 10,
    jitterMs: 5,
  });

  console.log(TerminalReporter.format(vulnReport));
  await vulnerableServer.stop();

  // 2. Run against Hardened sandbox
  console.log(`\n ${pc.bold(pc.green('▶ STEP 2: Auditing Hardened Target (Idempotency Lock + Atomic Tx)...'))}`);
  const hardenedServer = new SandboxServer({ port: 4456, mode: 'hardened' });
  const hardenedPort = await hardenedServer.start();
  const hardenedUrl = `http://localhost:${hardenedPort}/api/billing`;

  const suite2 = createBillingSuite('stripe');
  const hardenedReport = await TestRunner.runSuite(suite2, {
    targetUrl: hardenedUrl,
    concurrency: 10,
    jitterMs: 5,
  });

  console.log(TerminalReporter.format(hardenedReport));
  await hardenedServer.stop();

  console.log(` ${pc.bold(pc.green('✓ Adversarial proving ground completed successfully.'))}`);
  console.log(` ${pc.dim('Reports & AI prompts generated at .acid-test/\n')}`);
  return 0;
}
