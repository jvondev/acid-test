import type { InvariantSuite, InvariantTest } from '@acid-test/core';
import { RawByteBufferCheckTest } from './invariants/5.1-raw-byte-buffer-check.js';
import { TimestampToleranceReplayTest } from './invariants/5.2-timestamp-tolerance-replay.js';
import { TimingAttackCheckTest } from './invariants/5.3-timing-attack-check.js';
import { SlowlorisTimeoutTest } from './invariants/5.4-slowloris-timeout.js';

export function createWebhookSuite(provider: string = 'shopify'): InvariantSuite {
  const tests: InvariantTest[] = [
    new RawByteBufferCheckTest(),
    new TimestampToleranceReplayTest(),
    new TimingAttackCheckTest(),
    new SlowlorisTimeoutTest(),
  ];

  return {
    name: 'Webhook Ingress & Cryptographic Security Suite',
    category: 'webhook',
    provider,
    tests,
  };
}
