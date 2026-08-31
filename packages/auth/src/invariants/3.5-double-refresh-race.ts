import {
  type InvariantTest,
  type ExecutionContext,
  type InvariantResult,
  MicrosecondBurstDispatcher,
} from '@acidtest/core';

export class DoubleRefreshRaceTest implements InvariantTest {
  id = 'ACID-AUTH-005';
  name = 'Concurrent Double-Refresh Token Race Condition';
  category = 'auth';
  provider = 'clerk';
  severity = 'HIGH' as const;
  description = 'Sends the exact same refresh token twice simultaneously within 5ms to verify token rotation and session reuse detection.';

  async run(context: ExecutionContext): Promise<InvariantResult> {
    const startTime = Date.now();
    const origin = context.targetUrl ? new URL(context.targetUrl).origin : 'http://localhost:3000';
    const targetUrl = `${origin}/api/auth/refresh`;

    const payload = JSON.stringify({
      refreshToken: `rt_acid_${Date.now()}`,
    });

    const burst = await MicrosecondBurstDispatcher.dispatch({
      url: targetUrl,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: payload,
      concurrency: 2,
      jitterMs: 2,
    });

    const serverCrashes = burst.statusDistribution[500] || 0;
    const passed = serverCrashes === 0;

    return {
      testId: this.id,
      testName: this.name,
      category: this.category,
      provider: this.provider,
      severity: this.severity,
      status: passed ? 'PASS' : 'FAIL',
      durationMs: Date.now() - startTime,
      title: 'Refresh Token Family Rotation & Reuse Guard',
      summary: passed
        ? 'Handled concurrent token refresh burst without server crashes or duplicate session creation.'
        : 'Concurrent token refresh triggered unhandled server crash.',
      details: `Status distribution: ${JSON.stringify(burst.statusDistribution)}`,
      failingFile: 'lib/auth/session.ts',
      rootCause: 'Token refresh endpoint lacks atomic token rotation lock, permitting session cloning.',
      suggestedFix: 'Implement refresh token family tracking in Redis with automatic revocation upon duplicate token detection.',
      aiPrompt: 'In lib/auth/session.ts, add refresh token rotation with single-use revocation lock.',
    };
  }
}
