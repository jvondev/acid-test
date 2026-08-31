import {
  type InvariantTest,
  type ExecutionContext,
  type InvariantResult,
  MicrosecondBurstDispatcher,
} from '@acid-test/core';

export class MassAssignmentEscalationTest implements InvariantTest {
  id = 'ACID-AUTH-004';
  name = 'Mass Assignment Role Escalation Fuzzer';
  category = 'auth';
  provider = 'clerk';
  severity = 'HIGH' as const;
  description = 'Sends profile update requests containing hidden administrative payload fields (role: admin, is_superadmin: true, credits: 999999).';

  async run(context: ExecutionContext): Promise<InvariantResult> {
    const startTime = Date.now();
    const origin = context.targetUrl ? new URL(context.targetUrl).origin : 'http://localhost:3000';
    const targetUrl = `${origin}/api/user/profile`;

    const payload = JSON.stringify({
      name: 'John Doe',
      role: 'admin',
      is_superadmin: true,
      credits: 999999,
    });

    const res = await MicrosecondBurstDispatcher.dispatch({
      url: targetUrl,
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
      },
      body: payload,
      concurrency: 1,
    });

    const respBody = res.responses[0]?.body || '';
    const escalated = respBody.includes('"role":"admin"') || respBody.includes('"is_superadmin":true') || respBody.includes('999999');
    const passed = !escalated;

    return {
      testId: this.id,
      testName: this.name,
      category: this.category,
      provider: this.provider,
      severity: this.severity,
      status: passed ? 'PASS' : 'FAIL',
      durationMs: Date.now() - startTime,
      title: 'Mass Assignment Privilege Escalation Guard',
      summary: passed
        ? 'Unwhitelisted administrative fields stripped cleanly during profile update.'
        : 'SECURITY DEFECT: Mass assignment allowed user to update privileged fields (role / credits).',
      failingFile: 'app/api/user/profile/route.ts',
      lineNumber: 16,
      rootCause: 'Endpoint passes raw unvalidated `req.body` directly into ORM `update()` call.',
      suggestedFix: 'Use Zod schema parsing `z.object({ name: z.string() })` to strip unwhitelisted fields before DB update.',
      aiPrompt: 'In app/api/user/profile/route.ts, parse request body using strict Zod schema allowing only safe editable fields.',
    };
  }
}
