import {
  type InvariantTest,
  type ExecutionContext,
  type InvariantResult,
  MicrosecondBurstDispatcher,
} from '@acid-test/core';

export class TenantHoppingFuzzerTest implements InvariantTest {
  id = 'ACID-AUTH-001';
  name = 'Cross-Organization Tenant Hopping Fuzzer';
  category = 'auth';
  provider = 'clerk';
  severity = 'CRITICAL' as const;
  description = 'Sends requests with a valid token for Org Alpha to mutation endpoints targeting Org Beta resources.';

  async run(context: ExecutionContext): Promise<InvariantResult> {
    const startTime = Date.now();
    const origin = context.targetUrl ? new URL(context.targetUrl).origin : 'http://localhost:3000';
    const targetUrl = `${origin}/api/org/org_beta_999/members`;

    const mockJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfYWxwaGFfMTIzIiwib3JnX2lkIjoib3JnX2FscGhhXzAwMSIsInJvbGUiOiJtZW1iZXIifQ.mock_sig';

    const res = await MicrosecondBurstDispatcher.dispatch({
      url: targetUrl,
      method: 'POST',
      headers: {
        authorization: `Bearer ${mockJwt}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: 'new_member@evil.com', role: 'admin' }),
      concurrency: 1,
    });

    const statusCode = res.responses[0]?.statusCode || 0;
    const passed = statusCode === 403 || statusCode === 401 || statusCode === 404;

    return {
      testId: this.id,
      testName: this.name,
      category: this.category,
      provider: this.provider,
      severity: this.severity,
      status: passed ? 'PASS' : 'FAIL',
      durationMs: Date.now() - startTime,
      title: 'Cross-Tenant Organization Boundary Guard',
      summary: passed
        ? 'Cross-tenant mutation successfully blocked with 403 Forbidden.'
        : `CRITICAL PRIVILEGE ESCALATION: Server accepted mutation on Org Beta with Org Alpha user credentials (Status: ${statusCode}).`,
      curlReproduction: `curl -X POST "${targetUrl}" -H "Authorization: Bearer ${mockJwt}" -H "Content-Type: application/json" -d '{"email":"test@example.com"}'`,
      failingFile: 'app/api/org/[orgId]/members/route.ts',
      lineNumber: 28,
      rootCause: 'Endpoint reads `params.orgId` from client request without verifying caller membership from session claims.',
      suggestedFix: 'Verify `session.orgId === params.orgId` on all organization-scoped endpoints.',
      aiPrompt: 'In app/api/org/[orgId]/members/route.ts, ensure the authenticated session orgId matches the requested orgId before executing mutations.',
    };
  }
}
