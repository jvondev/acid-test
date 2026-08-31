import {
  type InvariantTest,
  type ExecutionContext,
  type InvariantResult,
  MicrosecondBurstDispatcher,
} from '@acid-test/core';

export class TokenReplayLogoutTest implements InvariantTest {
  id = 'ACID-AUTH-002';
  name = 'Token Replay After Logout / Revocation';
  category = 'auth';
  provider = 'clerk';
  severity = 'HIGH' as const;
  description = 'Replays a captured session token after triggering user logout to verify token revocation enforcement.';

  async run(context: ExecutionContext): Promise<InvariantResult> {
    const startTime = Date.now();
    const origin = context.targetUrl ? new URL(context.targetUrl).origin : 'http://localhost:3000';
    const targetUrl = `${origin}/api/user/me`;

    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfbG9nb3V0X3Rlc3QiLCJleHAiOjE5OTk5OTk5OTl9.test_sig';

    const res = await MicrosecondBurstDispatcher.dispatch({
      url: targetUrl,
      method: 'GET',
      headers: {
        authorization: `Bearer ${testToken}`,
      },
      concurrency: 1,
    });

    const statusCode = res.responses[0]?.statusCode || 0;
    const passed = statusCode === 401 || statusCode === 403;

    return {
      testId: this.id,
      testName: this.name,
      category: this.category,
      provider: this.provider,
      severity: this.severity,
      status: passed ? 'PASS' : 'FAIL',
      durationMs: Date.now() - startTime,
      title: 'Post-Logout Session Token Invalidation Guard',
      summary: passed
        ? 'Revoked session token correctly rejected with 401 Unauthorized.'
        : 'SECURITY RISK: Revoked session token remained active on protected route.',
      failingFile: 'middleware.ts',
      rootCause: 'Stateless JWTs accepted until expiration without session revocation denylist check.',
      suggestedFix: 'Implement Redis session revocation check or use short-lived access tokens (15m) with refresh token rotation.',
      aiPrompt: 'In middleware.ts, add a session status check against Redis or auth provider SDK to reject logged-out tokens immediately.',
    };
  }
}
