import {
  type InvariantTest,
  type ExecutionContext,
  type InvariantResult,
  MicrosecondBurstDispatcher,
  MultiProviderHmacEngine,
  RawBufferUtils,
} from '@acid-test/core';

export class MutatedPayloadTamperTest implements InvariantTest {
  id = 'ACID-BILLING-002';
  name = 'Mutated Payload with Same Idempotency Key (Tamper Fuzzer)';
  category = 'billing';
  provider = 'stripe';
  severity = 'CRITICAL' as const;
  description = 'Sends valid webhook payload, then immediately sends a second payload with same event ID but mutated customer_id and amount to detect forged event re-use.';

  async run(context: ExecutionContext): Promise<InvariantResult> {
    const startTime = Date.now();
    const targetUrl = context.targetUrl || 'http://localhost:3000/api/webhooks/stripe';
    const secret = context.webhookSecret || 'whsec_acid_test_test_secret_key_12345';
    const eventId = `evt_acid_tamper_${Date.now()}`;

    // Payload 1: legitimate payload
    const originalPayload = JSON.stringify({
      id: eventId,
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: `pi_orig_${Date.now()}`,
          amount: 5000,
          customer: 'cus_legit_user',
        },
      },
    });

    // Payload 2: mutated amount & customer with same eventId
    const tamperedPayload = JSON.stringify({
      id: eventId,
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: `pi_orig_${Date.now()}`,
          amount: 999900, // Attempting $9,999 privilege escalation
          customer: 'cus_attacker_user',
        },
      },
    });

    const sig1 = MultiProviderHmacEngine.sign({ provider: 'stripe', secret, payload: originalPayload });
    const sig2 = MultiProviderHmacEngine.sign({ provider: 'stripe', secret, payload: tamperedPayload });

    // Send original
    const res1 = await MicrosecondBurstDispatcher.dispatch({
      url: targetUrl,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [sig1.headerName]: sig1.headerValue,
      },
      body: originalPayload,
      concurrency: 1,
    });

    // Send tampered immediately
    const res2 = await MicrosecondBurstDispatcher.dispatch({
      url: targetUrl,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [sig2.headerName]: sig2.headerValue,
      },
      body: tamperedPayload,
      concurrency: 1,
    });

    const resp2Body = res2.responses[0]?.body || '';
    const tamperedAccepted = resp2Body.includes('cus_attacker_user') || resp2Body.includes('999900');

    const passed = !tamperedAccepted;

    return {
      testId: this.id,
      testName: this.name,
      category: this.category,
      provider: this.provider,
      severity: this.severity,
      status: passed ? 'PASS' : 'FAIL',
      durationMs: Date.now() - startTime,
      title: 'Mutated Payload Idempotency Tamper Guard',
      summary: passed
        ? 'Backend rejected or ignored mutated payload with previously processed event ID.'
        : 'CRITICAL VULNERABILITY: Backend accepted mutated payload reusing an existing event ID, allowing unauthorized balance/privilege manipulation.',
      curlReproduction: `curl -X POST "${targetUrl}" -H "${sig2.headerName}: ${sig2.headerValue}" -H "Content-Type: application/json" -d '${tamperedPayload}'`,
      failingFile: 'app/api/webhooks/stripe/route.ts',
      lineNumber: 45,
      rootCause: 'Backend does not verify that event ID payload hash matches original recorded payload when duplicate event is received.',
      suggestedFix: 'Store SHA-256 hash of processed webhook payloads alongside event ID and reject duplicate IDs with differing payload hashes.',
      aiPrompt: 'In app/api/webhooks/stripe/route.ts, record incoming event ID hash in idempotency table and ignore conflicting payload mutations.',
    };
  }
}
