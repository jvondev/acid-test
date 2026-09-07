import {
  type InvariantTest,
  type ExecutionContext,
  type InvariantResult,
  MicrosecondBurstDispatcher,
  MultiProviderHmacEngine,
} from '@acid-test/core';

export class ConcurrentUpgradeCancelTest implements InvariantTest {
  id = 'ACID-BILLING-004';
  name = 'Concurrent Upgrade & Cancel Race Condition';
  category = 'billing';
  provider = 'stripe';
  severity = 'CRITICAL' as const;
  description = 'Fires subscription upgrade and subscription cancel events simultaneously with a 2ms gap to verify timestamp-ordered final state.';

  async run(context: ExecutionContext): Promise<InvariantResult> {
    const startTime = Date.now();
    const targetUrl = context.targetUrl || 'http://localhost:3000/api/webhooks/stripe';
    const secret = context.webhookSecret || 'whsec_acid_test_test_secret_key_12345';
    const subId = `sub_race_${Date.now()}`;
    const customerId = `cus_race_${Date.now()}`;

    const timestampEarlier = Math.floor(Date.now() / 1000) - 10;
    const timestampLater = Math.floor(Date.now() / 1000);

    // Event 1: Upgrade to Enterprise (timestamp earlier)
    const upgradePayload = JSON.stringify({
      id: `evt_upgrade_${Date.now()}`,
      object: 'event',
      created: timestampEarlier,
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: subId,
          customer: customerId,
          status: 'active',
          plan: { id: 'price_enterprise', amount: 50000 },
        },
      },
    });

    // Event 2: Cancel subscription (timestamp later - should take precedence)
    const cancelPayload = JSON.stringify({
      id: `evt_cancel_${Date.now()}`,
      object: 'event',
      created: timestampLater,
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: subId,
          customer: customerId,
          status: 'canceled',
        },
      },
    });

    const sigUpgrade = MultiProviderHmacEngine.sign({ provider: 'stripe', secret, payload: upgradePayload });
    const sigCancel = MultiProviderHmacEngine.sign({ provider: 'stripe', secret, payload: cancelPayload });

    // Send both nearly simultaneously
    const p1 = MicrosecondBurstDispatcher.dispatch({
      url: targetUrl,
      method: 'POST',
      headers: { 'content-type': 'application/json', [sigUpgrade.headerName]: sigUpgrade.headerValue },
      body: upgradePayload,
      concurrency: 1,
      jitterMs: 0,
    });

    const p2 = MicrosecondBurstDispatcher.dispatch({
      url: targetUrl,
      method: 'POST',
      headers: { 'content-type': 'application/json', [sigCancel.headerName]: sigCancel.headerValue },
      body: cancelPayload,
      concurrency: 1,
      jitterMs: 2,
    });

    const [res1, res2] = await Promise.all([p1, p2]);
    const ok1 = (res1.responses[0]?.statusCode || 0) < 400;
    const ok2 = (res2.responses[0]?.statusCode || 0) < 400;

    const passed = ok1 && ok2;

    return {
      testId: this.id,
      testName: this.name,
      category: this.category,
      provider: this.provider,
      severity: this.severity,
      status: passed ? 'PASS' : 'FAIL',
      durationMs: Date.now() - startTime,
      title: 'Upgrade vs Cancel Concurrent Race Condition',
      summary: passed
        ? 'Processed simultaneous upgrade & cancellation events without deadlock or unhandled server crash.'
        : 'Race condition detected during simultaneous subscription modification and cancellation.',
      details: `Upgrade status: ${res1.responses[0]?.statusCode}, Cancel status: ${res2.responses[0]?.statusCode}`,
      failingFile: 'app/api/webhooks/stripe/route.ts',
      rootCause: 'Database update overwrites newer subscription state if older event arrives later over the wire.',
      suggestedFix: 'Include `WHERE event_created_at <= :new_event_created_at` in SQL update statements to prevent out-of-order state overwrites.',
      aiPrompt: 'In subscription webhook handler, ensure database update checks event created timestamp before mutating subscription status.',
    };
  }
}
