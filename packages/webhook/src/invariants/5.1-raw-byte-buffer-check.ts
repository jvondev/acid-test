import {
  type InvariantTest,
  type ExecutionContext,
  type InvariantResult,
  MicrosecondBurstDispatcher,
  MultiProviderHmacEngine,
  RawBufferUtils,
} from '@acid-test/core';

export class RawByteBufferCheckTest implements InvariantTest {
  id = 'ACID-WEBHOOK-001';
  name = 'Raw Byte-Buffer vs. Mutated JSON Body Parser Check';
  category = 'webhook';
  provider = 'shopify';
  severity = 'CRITICAL' as const;
  description = 'Sends a validly signed webhook payload with irregular whitespace to test raw-buffer vs re-stringified JSON HMAC verifiers.';

  async run(context: ExecutionContext): Promise<InvariantResult> {
    const startTime = Date.now();
    const targetUrl = context.targetUrl || 'http://localhost:3000/api/webhooks/shopify';
    const secret = context.webhookSecret || 'shpss_acidtest_test_secret_key_12345';

    // JSON payload with irregular un-normalized whitespace
    const rawWhitespacePayload = RawBufferUtils.mutateJsonWhitespace({
      id: 99887766,
      event: 'orders/create',
      total_price: '149.00',
      currency: 'USD',
    });

    const sig = MultiProviderHmacEngine.sign({
      provider: 'shopify',
      secret,
      payload: rawWhitespacePayload,
    });

    const res = await MicrosecondBurstDispatcher.dispatch({
      url: targetUrl,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [sig.headerName]: sig.headerValue,
      },
      body: rawWhitespacePayload,
      concurrency: 1,
    });

    const statusCode = res.responses[0]?.statusCode || 0;
    const passed = statusCode >= 200 && statusCode < 300;

    return {
      testId: this.id,
      testName: this.name,
      category: this.category,
      provider: this.provider,
      severity: this.severity,
      status: passed ? 'PASS' : 'FAIL',
      durationMs: Date.now() - startTime,
      title: 'Raw Request Byte-Buffer Integrity Guard',
      summary: passed
        ? 'Webhook gateway verifies HMAC over raw request byte buffer without JSON serialization drift.'
        : `SIGNATURE VERIFICATION FAILURE: Webhook rejected valid signature on raw buffer (Status: ${statusCode}). Likely verifying JSON.stringify(body) instead of req.rawBody.`,
      curlReproduction: `curl -X POST "${targetUrl}" -H "${sig.headerName}: ${sig.headerValue}" -H "Content-Type: application/json" -d '${rawWhitespacePayload.replace(/\n/g, '\\n')}'`,
      failingFile: 'app/api/webhooks/shopify/route.ts',
      lineNumber: 18,
      rootCause: 'Backend middleware parses request body before HMAC computation, recalculating hash on mutated stringified object.',
      suggestedFix: 'Read untouched request text via `await req.text()` in Next.js or configure Express `verify: (req, res, buf) => { req.rawBody = buf }`.',
      aiPrompt: 'In app/api/webhooks/shopify/route.ts, verify the HMAC signature against the raw unparsed request buffer instead of JSON.stringify(req.body).',
    };
  }
}
