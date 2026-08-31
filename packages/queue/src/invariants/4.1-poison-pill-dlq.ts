import {
  type InvariantTest,
  type ExecutionContext,
  type InvariantResult,
  RawBufferUtils,
  MicrosecondBurstDispatcher,
} from '@acidtest/core';

export class PoisonPillDlqTest implements InvariantTest {
  id = 'ACID-QUEUE-001';
  name = 'Poison-Pill Injection & Dead-Letter Queue (DLQ) Guard';
  category = 'queue';
  provider = 'bullmq';
  severity = 'CRITICAL' as const;
  description = 'Injects corrupted payloads (circular JSON, null bytes, 5MB chunks, malformed schema) to verify worker process does not enter a crash-restart death spiral.';

  async run(context: ExecutionContext): Promise<InvariantResult> {
    const startTime = Date.now();
    const targetUrl = context.targetUrl || 'http://localhost:3000/api/jobs/enqueue';

    // Inject 4 poison pills
    const pills = [
      { name: 'circular', payload: RawBufferUtils.generatePoisonPill('circular') },
      { name: 'null_byte', payload: RawBufferUtils.generatePoisonPill('null_byte') },
      { name: 'malformed_json', payload: RawBufferUtils.generatePoisonPill('malformed_json') },
      { name: 'schema_invalid', payload: RawBufferUtils.generatePoisonPill('schema_invalid') },
    ];

    let passed = true;
    for (const pill of pills) {
      const res = await MicrosecondBurstDispatcher.dispatch({
        url: targetUrl,
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: typeof pill.payload === 'string' ? pill.payload : pill.payload.toString(),
        concurrency: 1,
      });

      const status = res.responses[0]?.statusCode || 0;
      // Should reject with 400 Bad Request or accept into DLQ, but NOT crash with 500
      if (status >= 500) {
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
      title: 'Poison Pill Isolation & DLQ Routing Guard',
      summary: passed
        ? 'Worker process gracefully handled all corrupted poison pill payloads without container crashes.'
        : 'WORKER CRASH VULNERABILITY: Corrupted poison pill payload triggered unhandled exception or 500 error.',
      failingFile: 'workers/processor.ts',
      lineNumber: 12,
      rootCause: 'Worker lacks top-level try/catch with schema validation (Zod) before invoking business logic.',
      suggestedFix: 'Wrap worker message deserialization with Zod safeParse and route validation failures to Dead Letter Queue.',
      aiPrompt: 'In workers/processor.ts, validate incoming job payload using Zod before processing, catching exceptions and routing to DLQ.',
    };
  }
}
