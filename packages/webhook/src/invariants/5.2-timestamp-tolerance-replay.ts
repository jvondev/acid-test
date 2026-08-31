import {
  type InvariantTest,
  type ExecutionContext,
  type InvariantResult,
  MicrosecondBurstDispatcher,
  MultiProviderHmacEngine,
} from '@acidtest/core';

export class TimestampToleranceReplayTest implements InvariantTest {
  id = 'ACID-WEBHOOK-002';
  name = 'Timestamp Tolerance Window & Replay Attack Fuzzer';
  category = 'webhook';
  provider = 'stripe';
  severity = 'HIGH' as const;
  description = 'Replays a validly signed webhook with a timestamp from 10 minutes ago to verify tolerance window enforcement (<= 300s).';

  async run(context: ExecutionContext): Promise<InvariantResult> {
    const startTime = Date.now();
    const targetUrl = context.targetUrl || 'http://localhost:3000/api/webhooks/stripe';
    const secret = context.webhookSecret || 'whsec_acidtest_test_secret_key_12345';

    // Timestamp 10 minutes (600s) in the past
    const expiredTimestamp = Math.floor(Date.now() / 1000) - 600;
    const payload = JSON.stringify({
      id: `evt_replay_${Date.now()}`,
      object: 'event',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_replay_test' } },
    });

    const sig = MultiProviderHmacEngine.sign({
      provider: 'stripe',
      secret,
      payload,
      timestamp: expiredTimestamp,
    });

    const res = await MicrosecondBurstDispatcher.dispatch({
      url: targetUrl,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [sig.headerName]: sig.headerValue,
      },
      body: payload,
      concurrency: 1,
    });

    const statusCode = res.responses[0]?.statusCode || 0;
    // Expired timestamp should be rejected (400 or 401)
    const passed = statusCode === 400 || statusCode === 401;

    return {
      testId: this.id,
      testName: this.name,
      category: this.category,
      provider: this.provider,
      severity: this.severity,
      status: passed ? 'PASS' : 'FAIL',
      durationMs: Date.now() - startTime,
      title: 'Timestamp Tolerance & Replay Attack Defense',
      summary: passed
        ? 'Stale webhook (10m old timestamp) correctly rejected with 400 Bad Request.'
        : `REPLAY ATTACK VULNERABILITY: Endpoint accepted 10-minute old expired webhook timestamp (Status: ${statusCode}).`,
      curlReproduction: `curl -X POST "${targetUrl}" -H "${sig.headerName}: ${sig.headerValue}" -H "Content-Type: application/json" -d '${payload}'`,
      failingFile: 'app/api/webhooks/stripe/route.ts',
      lineNumber: 22,
      rootCause: 'Webhook handler does not compare header timestamp `t=...` against `Math.floor(Date.now() / 1000)`.',
      suggestedFix: 'Enforce timestamp tolerance: reject webhooks where `Math.abs(Date.now()/1000 - timestamp) > 300`.',
      aiPrompt: 'In app/api/webhooks/stripe/route.ts, add a timestamp tolerance check rejecting events older than 300 seconds.',
    };
  }
}
