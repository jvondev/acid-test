import pc from 'picocolors';
import { SandboxServer, TestRunner, TerminalReporter } from '@acidtest/core';
import { createBillingSuite } from '@acidtest/billing';

export async function runDemoCommand(): Promise<number> {
  console.log(pc.bold(pc.cyan(`\n═════════════════════════════════════════════════════════════════════════`)));
  console.log(pc.bold(pc.white(`  ACIDTEST ADVERSARIAL LIVE DEMONSTRATION & PROVING GROUND`)));
  console.log(pc.dim(`  Executing real microsecond bursts against Vulnerable vs Hardened targets`));
  console.log(pc.bold(pc.cyan(`═════════════════════════════════════════════════════════════════════════\n`)));

  // 1. Run against Vulnerable sandbox
  console.log(pc.bold(pc.red(`▶ STEP 1: Auditing Vulnerable Production Target (Race Condition Window)...`)));
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

  console.log('\n' + pc.dim('─'.repeat(75)) + '\n');

  // 2. Run against Hardened sandbox
  console.log(pc.bold(pc.green(`▶ STEP 2: Auditing Hardened Target (Idempotency Lock + Atomic Tx)...`)));
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

  console.log(pc.bold(pc.green(`\n✓ Adversarial demonstration completed successfully.`)));
  console.log(pc.dim(`  Reports & AI prompts generated at .acidtest/`));
  return 0;
}
