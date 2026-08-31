import type { InvariantSuite, InvariantTest } from '@acid-test/core';
import { PoisonPillDlqTest } from './invariants/4.1-poison-pill-dlq.js';
import { SigkillStalledRecoveryTest } from './invariants/4.2-sigkill-stalled-recovery.js';
import { RetryStormBackoffTest } from './invariants/4.3-retry-storm-backoff.js';
import { LockLeaseExpiryTest } from './invariants/4.4-lock-lease-expiry.js';

export function createQueueSuite(provider: string = 'bullmq'): InvariantSuite {
  const tests: InvariantTest[] = [
    new PoisonPillDlqTest(),
    new SigkillStalledRecoveryTest(),
    new RetryStormBackoffTest(),
    new LockLeaseExpiryTest(),
  ];

  return {
    name: 'Distributed Queue & Worker Chaos Suite',
    category: 'queue',
    provider,
    tests,
  };
}
