import type { InvariantSuite, InvariantTest } from '@acidtest/core';
import { TenantHoppingFuzzerTest } from './invariants/3.1-tenant-hopping-fuzzer.js';
import { TokenReplayLogoutTest } from './invariants/3.2-token-replay-logout.js';
import { JwtAlgNoneAttackTest } from './invariants/3.3-jwt-alg-none-attack.js';
import { MassAssignmentEscalationTest } from './invariants/3.4-mass-assignment-escalation.js';
import { DoubleRefreshRaceTest } from './invariants/3.5-double-refresh-race.js';

export function createAuthSuite(provider: string = 'clerk'): InvariantSuite {
  const tests: InvariantTest[] = [
    new TenantHoppingFuzzerTest(),
    new TokenReplayLogoutTest(),
    new JwtAlgNoneAttackTest(),
    new MassAssignmentEscalationTest(),
    new DoubleRefreshRaceTest(),
  ];

  return {
    name: 'Auth & Identity Invariant Suite',
    category: 'auth',
    provider,
    tests,
  };
}
