import type { InvariantSuite, InvariantTest } from '@acid-test/core';
import { TemplateVariableLeakTest } from './invariants/7.1-template-variable-leak.js';
import { DeadAssetScannerTest } from './invariants/7.2-dead-asset-scanner.js';
import { SpamScorePreflightTest } from './invariants/7.3-spam-score-preflight.js';

export function createEmailSuite(provider: string = 'resend'): InvariantSuite {
  const tests: InvariantTest[] = [
    new TemplateVariableLeakTest(),
    new DeadAssetScannerTest(),
    new SpamScorePreflightTest(),
  ];

  return {
    name: 'Transactional Email & Communication Suite',
    category: 'email',
    provider,
    tests,
  };
}
