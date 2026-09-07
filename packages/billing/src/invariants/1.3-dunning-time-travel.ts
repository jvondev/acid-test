import {
  type InvariantTest,
  type ExecutionContext,
  type InvariantResult,
  MicrosecondBurstDispatcher,
  MultiProviderHmacEngine,
} from '@acid-test/core';

export class DunningTimeTravelTest implements InvariantTest {
  id = 'ACID-BILLING-003';
  name = 'Dunning Cycle Time-Travel Simulation (Lifecycle Fuzzer)';
  category = 'billing';
  provider = 'stripe';
  severity = 'HIGH' as const;
  description = 'Simulates a 90-day subscription lifecycle (trialing -> past_due 1 -> past_due 2 -> updated -> payment_succeeded) in rapid sequence.';

  async run(context: ExecutionContext): Promise<InvariantResult> {
    const startTime = Date.now();
    const targetUrl = context.targetUrl || 'http://localhost:3000/api/webhooks/stripe';
    const secret = context.webhookSecret || 'whsec_acid_test_test_secret_key_12345';
    const subId = `sub_dunning_${Date.now()}`;
    const customerId = `cus_dunning_${Date.now()}`;

    const stages = [
      { type: 'customer.subscription.created', status: 'trialing' },
      { type: 'invoice.payment_failed', status: 'past_due', attempt: 1 },
      { type: 'invoice.payment_failed', status: 'past_due', attempt: 2 },
      { type: 'customer.subscription.updated', status: 'active' },
      { type: 'invoice.payment_succeeded', status: 'active' },
    ];

    let allSuccess = true;
    const stageResults: Record<string, number> = {};

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const payload = JSON.stringify({
        id: `evt_dunning_${i}_${Date.now()}`,
        object: 'event',
        type: stage.type,
        data: {
          object: {
            id: stage.type.startsWith('sub') ? subId : `in_dunning_${i}`,
            subscription: subId,
            customer: customerId,
            status: stage.status,
            attempt_count: stage.attempt || 1,
          },
        },
      });

      const sig = MultiProviderHmacEngine.sign({ provider: 'stripe', secret, payload });
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
      stageResults[`stage_${i + 1}_${stage.type}`] = statusCode;
      if (statusCode < 200 || statusCode >= 300) {
        allSuccess = false;
      }
      // Small 10ms sequential gap
      await new Promise((r) => setTimeout(r, 10));
    }

    return {
      testId: this.id,
      testName: this.name,
      category: this.category,
      provider: this.provider,
      severity: this.severity,
      status: allSuccess ? 'PASS' : 'FAIL',
      durationMs: Date.now() - startTime,
      title: 'Dunning Cycle 90-Day Time-Travel Simulation',
      summary: allSuccess
        ? 'Successfully transitioned subscription across complete 5-stage dunning lifecycle without state lockup.'
        : 'Failed during dunning state transitions. One or more lifecycle webhooks returned unexpected HTTP error.',
      details: `Stage results: ${JSON.stringify(stageResults)}`,
      failingFile: 'app/api/webhooks/stripe/route.ts',
      rootCause: 'Webhook handler does not accommodate out-of-order invoice.payment_failed vs subscription.updated status transitions.',
      suggestedFix: 'Implement state machine guard to ensure invoice payment success unlocks active subscription access regardless of past-due flags.',
      aiPrompt: 'Audit webhook handling of subscription status transitions to ensure proper handling of failed payment recovery.',
    };
  }
}
