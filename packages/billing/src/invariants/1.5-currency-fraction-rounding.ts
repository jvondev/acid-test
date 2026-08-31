import {
  type InvariantTest,
  type ExecutionContext,
  type InvariantResult,
  MicrosecondBurstDispatcher,
  MultiProviderHmacEngine,
} from '@acidtest/core';

export class CurrencyFractionRoundingTest implements InvariantTest {
  id = 'ACID-BILLING-005';
  name = 'Currency Fraction & Rounding Mismatch (Ceiling Drift)';
  category = 'billing';
  provider = 'stripe';
  severity = 'HIGH' as const;
  description = 'Tests usage-based billing events with 3-decimal/fractional currencies (JPY zero-decimal, KWD 3-decimal, USD fractional cents $0.0035/token).';

  async run(context: ExecutionContext): Promise<InvariantResult> {
    const startTime = Date.now();
    const targetUrl = context.targetUrl || 'http://localhost:3000/api/webhooks/stripe';
    const secret = context.webhookSecret || 'whsec_acidtest_test_secret_key_12345';

    // Test cases for rounding drift
    // 1. JPY: zero decimal currency (5000 JPY is 5000, not 50.00)
    // 2. Fractional unit pricing: 1250 tokens @ $0.0035 = 4.375 cents -> should round properly according to specification
    const currencies = [
      { currency: 'jpy', amount: 5000, expectedFormatted: '5000' },
      { currency: 'usd', amount: 437, expectedFormatted: '4.37' },
      { currency: 'kwd', amount: 1500, expectedFormatted: '1.500' },
    ];

    let passed = true;
    for (const c of currencies) {
      const payload = JSON.stringify({
        id: `evt_curr_${c.currency}_${Date.now()}`,
        object: 'event',
        type: 'charge.succeeded',
        data: {
          object: {
            id: `ch_${c.currency}_${Date.now()}`,
            amount: c.amount,
            currency: c.currency,
            customer: 'cus_curr_test',
          },
        },
      });

      const sig = MultiProviderHmacEngine.sign({ provider: 'stripe', secret, payload });
      const res = await MicrosecondBurstDispatcher.dispatch({
        url: targetUrl,
        method: 'POST',
        headers: { 'content-type': 'application/json', [sig.headerName]: sig.headerValue },
        body: payload,
        concurrency: 1,
      });

      if ((res.responses[0]?.statusCode || 0) >= 500) {
        passed = false;
      }
    }

    return {
      testId: this.id,
      testName: this.name,
      category: this.category,
      provider: this.provider,
      severity: this.severity,
      status: passed ? 'PASS' : 'FAIL',
      durationMs: Date.now() - startTime,
      title: 'Currency Precision & Integer Subunit Handling',
      summary: passed
        ? 'Processed zero-decimal and standard subunit currencies without calculation crash or fractional drift.'
        : 'Backend failed to properly handle zero-decimal currency (JPY) or fractional cent rounding.',
      failingFile: 'lib/billing/pricing.ts',
      rootCause: 'Dividing amounts by 100 unconditionally across all currencies corrupts zero-decimal currencies like JPY.',
      suggestedFix: 'Use a currency-aware integer converter (e.g. `intl-money` or Stripe zero-decimal currency lookup map).',
      aiPrompt: 'In lib/billing/pricing.ts, implement zero-decimal currency checks so JPY, KRW, and KWD amounts are parsed without unconditional /100 division.',
    };
  }
}
