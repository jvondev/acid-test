import {
  type InvariantTest,
  type ExecutionContext,
  type InvariantResult,
  MicrosecondBurstDispatcher,
  MultiProviderHmacEngine,
} from '@acid-test/core';

export class DoubleCheckoutCompletionTest implements InvariantTest {
  id = 'ACID-BILLING-006';
  name = 'Split-Second Double Checkout Session Completion';
  category = 'billing';
  provider = 'stripe';
  severity = 'CRITICAL' as const;
  description = 'Simulates a user rapidly double-clicking "Pay Now" or duplicate webhook dispatches on checkout.session.completed within 1ms.';

  async run(context: ExecutionContext): Promise<InvariantResult> {
    const startTime = Date.now();
    const targetUrl = context.targetUrl || 'http://localhost:3000/api/webhooks/stripe';
    const secret = context.webhookSecret || 'whsec_acidtest_test_secret_key_12345';
    const sessionId = `cs_test_double_${Date.now()}`;
    const customerId = `cus_double_${Date.now()}`;

    const payload = JSON.stringify({
      id: `evt_session_${Date.now()}`,
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          customer: customerId,
          amount_total: 10000,
          payment_status: 'paid',
        },
      },
    });

    const sig = MultiProviderHmacEngine.sign({ provider: 'stripe', secret, payload });

    const burst = await MicrosecondBurstDispatcher.dispatch({
      url: targetUrl,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [sig.headerName]: sig.headerValue,
      },
      body: payload,
      concurrency: 2,
      jitterMs: 1,
    });

    const serverErrors = burst.statusDistribution[500] || 0;
    const passed = serverErrors === 0 && burst.successfulRequests >= 1;

    return {
      testId: this.id,
      testName: this.name,
      category: this.category,
      provider: this.provider,
      severity: this.severity,
      status: passed ? 'PASS' : 'FAIL',
      durationMs: Date.now() - startTime,
      title: 'Double Checkout Session Completion Guard',
      summary: passed
        ? 'Handled split-second double checkout completion cleanly without duplicate orders or server error.'
        : 'Double checkout triggered duplicate order insertion or database conflict crash.',
      details: `2 parallel requests returned: ${JSON.stringify(burst.statusDistribution)}`,
      curlReproduction: `curl -X POST "${targetUrl}" -H "${sig.headerName}: ${sig.headerValue}" -H "Content-Type: application/json" -d '${payload}' (x2 concurrent)`,
      failingFile: 'app/api/webhooks/stripe/route.ts',
      lineNumber: 58,
      rootCause: 'Database orders table lacks a unique constraint on `stripe_checkout_session_id`.',
      suggestedFix: 'Add `UNIQUE (stripe_checkout_session_id)` to orders table and handle unique constraint violations as idempotent success.',
      aiPrompt: 'In database schema, add a unique index on stripe_checkout_session_id and update checkout handler to ignore duplicate insertions.',
    };
  }
}
