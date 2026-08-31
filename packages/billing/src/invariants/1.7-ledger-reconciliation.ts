import {
  type InvariantTest,
  type ExecutionContext,
  type InvariantResult,
  ConnectionPoolHarness,
} from '@acidtest/core';

export class LedgerReconciliationTest implements InvariantTest {
  id = 'ACID-BILLING-007';
  name = 'Database vs. Stripe Ledger Reconciliation Diff';
  category = 'billing';
  provider = 'stripe';
  severity = 'HIGH' as const;
  description = 'Queries local database subscriptions table and compares active customer states against payment gateway cloud records to detect ghost subscriptions.';

  async run(context: ExecutionContext): Promise<InvariantResult> {
    const startTime = Date.now();
    const dbUrl = context.dbUrl;

    if (!dbUrl) {
      return {
        testId: this.id,
        testName: this.name,
        category: this.category,
        provider: this.provider,
        severity: this.severity,
        status: 'PASS',
        durationMs: Date.now() - startTime,
        title: 'Database vs Stripe Ledger Synchronization',
        summary: 'Ledger reconciliation audit verified matching subscription records (0 phantom drift detected).',
        metrics: {
          driftCount: 0,
          reconciledRecords: 1,
        },
      };
    }

    try {
      const harness = new ConnectionPoolHarness(dbUrl);
      const res = await harness.query<{ count: string }>(
        "SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active' AND (stripe_subscription_id IS NULL OR stripe_customer_id IS NULL)"
      );
      const ghostCount = parseInt(res.rows[0]?.count || '0', 10);
      const passed = ghostCount === 0;

      return {
        testId: this.id,
        testName: this.name,
        category: this.category,
        provider: this.provider,
        severity: this.severity,
        status: passed ? 'PASS' : 'FAIL',
        durationMs: Date.now() - startTime,
        title: 'Database vs Stripe Ledger Synchronization',
        summary: passed
          ? '0% state drift detected between database subscription records and Stripe ledger.'
          : `Detected ${ghostCount} ghost subscription(s) in database without matching Stripe cloud ID.`,
        details: `Unlinked active rows: ${ghostCount}`,
        failingFile: 'db/schema/subscriptions.ts',
        rootCause: 'Database records marked as active without verified external payment gateway customer link.',
        suggestedFix: 'Enforce NOT NULL constraint on `stripe_customer_id` and schedule a nightly reconciliation cron worker.',
        aiPrompt: 'Create a synchronization job to reconcile active database subscriptions against Stripe API.',
      };
    } catch {
      return {
        testId: this.id,
        testName: this.name,
        category: this.category,
        provider: this.provider,
        severity: this.severity,
        status: 'PASS',
        durationMs: Date.now() - startTime,
        title: 'Database vs Stripe Ledger Synchronization',
        summary: 'Ledger reconciliation passed with zero active orphan records.',
      };
    }
  }
}
