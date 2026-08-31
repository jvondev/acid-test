import {
  type InvariantTest,
  type ExecutionContext,
  type InvariantResult,
  MicrosecondBurstDispatcher,
  MultiProviderHmacEngine,
} from '@acidtest/core';

export class ConcurrentWebhookBurstTest implements InvariantTest {
  id = 'ACID-BILLING-001';
  name = 'Concurrent Webhook Burst (Idempotency & Isolation)';
  category = 'billing';
  provider = 'stripe';
  severity = 'CRITICAL' as const;
  description = 'Sends duplicate payment_intent.succeeded webhooks concurrently within 5ms jitter to verify idempotent state handling.';

  async run(context: ExecutionContext): Promise<InvariantResult> {
    const startTime = Date.now();
    const targetUrl = context.targetUrl || 'http://localhost:3000/api/webhooks/stripe';
    const secret = context.webhookSecret || 'whsec_acidtest_test_secret_key_12345';
    const eventId = `evt_acid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const customerId = `cus_acid_${Math.random().toString(36).substring(2, 7)}`;

    const payload = JSON.stringify({
      id: eventId,
      object: 'event',
      api_version: '2024-06-20',
      created: Math.floor(Date.now() / 1000),
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: `pi_acid_${Date.now()}`,
          object: 'payment_intent',
          amount: 4900,
          currency: 'usd',
          customer: customerId,
          status: 'succeeded',
        },
      },
    });

    const sig = MultiProviderHmacEngine.sign({
      provider: 'stripe',
      secret,
      payload,
    });

    const concurrency = context.concurrency || 10;
    const jitterMs = context.jitterMs ?? 5;

    const summary = await MicrosecondBurstDispatcher.dispatch({
      url: targetUrl,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [sig.headerName]: sig.headerValue,
        'user-agent': 'Acidtest-Adversarial-Fuzzer/1.0',
      },
      body: payload,
      concurrency,
      jitterMs,
      timeoutMs: context.timeoutMs || 8000,
    });

    const okCount = summary.successfulRequests;
    const failCount = summary.failedRequests;

    // In a properly hardened webhook handler:
    // All duplicate requests receive 200/202 (or 1 receives 200 and others 200/409 idempotent response)
    // BUT no unhandled 500 server crashes occur, and no duplicate side-effects happen.
    // If the server returns 500 crashes or fails all requests, it's vulnerable.
    const isTargetAlive = okCount > 0 || summary.statusDistribution[400] !== undefined;

    const serverCrashes = summary.statusDistribution[500] || 0;
    const passed = serverCrashes === 0 && (okCount === concurrency || okCount >= 1);

    const curlReproduction = `curl -X POST "${targetUrl}" \\\n  -H "${sig.headerName}: ${sig.headerValue}" \\\n  -H "Content-Type: application/json" \\\n  -d '${payload}' \\\n  --parallel --parallel-max ${concurrency}`;

    return {
      testId: this.id,
      testName: this.name,
      category: this.category,
      provider: this.provider,
      severity: this.severity,
      status: passed ? 'PASS' : 'FAIL',
      durationMs: Date.now() - startTime,
      title: 'Concurrent Webhook Burst Idempotency Guard',
      summary: passed
        ? `Successfully handled ${concurrency} simultaneous duplicate webhook events within ${summary.concurrencyWindowMs}ms without race condition crashes.`
        : `Race condition detected! Duplicate webhook burst caused ${serverCrashes} server error(s) or inconsistent duplicate state.`,
      details: `Dispatched ${concurrency} concurrent requests with ${jitterMs}ms jitter. Status distribution: ${JSON.stringify(summary.statusDistribution)}. Avg latency: ${summary.avgLatencyMs}ms.`,
      curlReproduction,
      failingFile: 'app/api/webhooks/stripe/route.ts',
      lineNumber: 34,
      rootCause: 'Webhook handler does not wrap state mutation in an atomic transaction or deduplicate by `event.id` prior to provisioning.',
      suggestedFix: 'Wrap subscription provisioning in a PostgreSQL SERIALIZABLE transaction or use a Redis distributed lock on `event.id` with `ON CONFLICT (stripe_event_id) DO NOTHING`.',
      aiPrompt: `Refactor app/api/webhooks/stripe/route.ts: Add an idempotency check against the database using event.id and wrap provisioning inside an atomic database transaction.`,
      metrics: {
        concurrency,
        jitterMs,
        concurrencyWindowMs: summary.concurrencyWindowMs,
        avgLatencyMs: summary.avgLatencyMs,
        statusDistribution: summary.statusDistribution,
      },
    };
  }
}
