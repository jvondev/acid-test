import type { InvariantSuite, InvariantTest } from '@acid-test/core';
import { ConcurrentWebhookBurstTest } from './invariants/1.1-concurrent-webhook-burst.js';
import { MutatedPayloadTamperTest } from './invariants/1.2-mutated-payload-tamper.js';
import { DunningTimeTravelTest } from './invariants/1.3-dunning-time-travel.js';
import { ConcurrentUpgradeCancelTest } from './invariants/1.4-concurrent-upgrade-cancel.js';
import { CurrencyFractionRoundingTest } from './invariants/1.5-currency-fraction-rounding.js';
import { DoubleCheckoutCompletionTest } from './invariants/1.6-double-checkout-completion.js';
import { LedgerReconciliationTest } from './invariants/1.7-ledger-reconciliation.js';

export function createBillingSuite(provider: string = 'stripe'): InvariantSuite {
  const tests: InvariantTest[] = [
    new ConcurrentWebhookBurstTest(),
    new MutatedPayloadTamperTest(),
    new DunningTimeTravelTest(),
    new ConcurrentUpgradeCancelTest(),
    new CurrencyFractionRoundingTest(),
    new DoubleCheckoutCompletionTest(),
    new LedgerReconciliationTest(),
  ];

  return {
    name: 'Billing & Financial Invariant Suite',
    category: 'billing',
    provider,
    tests,
  };
}
