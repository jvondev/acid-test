import type { InvariantSuite, InvariantTest } from '@acid-test/core';
import { RlsPenetrationMatrixTest } from './invariants/2.1-rls-penetration-matrix.js';
import { SecurityDefinerLeakTest } from './invariants/2.2-security-definer-leak.js';
import { NPlusOneIndexAdvisorTest } from './invariants/2.3-n-plus-one-index-advisor.js';
import { DeadlockIsolationFuzzerTest } from './invariants/2.4-deadlock-isolation-fuzzer.js';
import { SoftDeleteLeakageTest } from './invariants/2.5-soft-delete-leakage.js';
import { PoolStarvationIdleTest } from './invariants/2.6-pool-starvation-idle.js';

export function createDbSuite(provider: string = 'postgresql'): InvariantSuite {
  const tests: InvariantTest[] = [
    new RlsPenetrationMatrixTest(),
    new SecurityDefinerLeakTest(),
    new NPlusOneIndexAdvisorTest(),
    new DeadlockIsolationFuzzerTest(),
    new SoftDeleteLeakageTest(),
    new PoolStarvationIdleTest(),
  ];

  return {
    name: 'Database & Isolation Invariant Suite',
    category: 'db',
    provider,
    tests,
  };
}
