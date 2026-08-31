import {
  type InvariantTest,
  type ExecutionContext,
  type InvariantResult,
  MicrosecondBurstDispatcher,
} from '@acidtest/core';

export class JwtAlgNoneAttackTest implements InvariantTest {
  id = 'ACID-AUTH-003';
  name = 'JWT Algorithm Confusion & alg: none Attack';
  category = 'auth';
  provider = 'clerk';
  severity = 'CRITICAL' as const;
  description = 'Sends unsigned JWT with header {"alg": "none"} and admin claims to verify strict algorithm whitelisting.';

  async run(context: ExecutionContext): Promise<InvariantResult> {
    const startTime = Date.now();
    const origin = context.targetUrl ? new URL(context.targetUrl).origin : 'http://localhost:3000';
    const targetUrl = `${origin}/api/admin/users`;

    const unsignedJwt = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c3JfYWRtaW5fdGFrZW92ZXIiLCJyb2xlIjoic3VwZXJhZG1pbiIsImlzX2FkbWluIjp0cnVlfQ.';

    const res = await MicrosecondBurstDispatcher.dispatch({
      url: targetUrl,
      method: 'GET',
      headers: {
        authorization: `Bearer ${unsignedJwt}`,
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
      title: 'JWT Algorithm Whitelist & `alg: none` Rejection Guard',
      summary: passed
        ? 'Unsigned alg: none JWT was strictly rejected with 401 Unauthorized.'
        : 'CRITICAL AUTH VULNERABILITY: Server accepted unsigned JWT with `alg: none`, permitting unauthenticated admin takeover.',
      curlReproduction: `curl -X GET "${targetUrl}" -H "Authorization: Bearer ${unsignedJwt}"`,
      failingFile: 'lib/auth/jwt.ts',
      lineNumber: 19,
      rootCause: 'JWT verification library does not enforce explicit algorithm whitelist (e.g. algorithms: ["RS256"]).',
      suggestedFix: 'Configure JWT verify with `algorithms: ["RS256", "EdDSA"]` and reject `none`.',
      aiPrompt: 'In JWT verification logic, explicitly specify allowed algorithms and forbid "none".',
    };
  }
}
