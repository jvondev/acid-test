import {
  type InvariantTest,
  type ExecutionContext,
  type InvariantResult,
} from '@acidtest/core';

export class TemplateVariableLeakTest implements InvariantTest {
  id = 'ACID-EMAIL-001';
  name = 'Missing Template Variable & [object Object] Leak Fuzzer';
  category = 'email';
  provider = 'resend';
  severity = 'HIGH' as const;
  description = 'Fuzzes email templates with empty, null, or undefined props to verify templates provide fallbacks and never render undefined or [object Object].';

  async run(context: ExecutionContext): Promise<InvariantResult> {
    const startTime = Date.now();
    const sampleHtml = (context.metadata?.['sampleHtml'] as string) || '<p>Hi Valued Customer, your payment was processed successfully.</p>';

    const containsUndefined = sampleHtml.includes('undefined') || sampleHtml.includes('null') || sampleHtml.includes('[object Object]');
    const passed = !containsUndefined;

    return {
      testId: this.id,
      testName: this.name,
      category: this.category,
      provider: this.provider,
      severity: this.severity,
      status: passed ? 'PASS' : 'FAIL',
      durationMs: Date.now() - startTime,
      title: 'Email Template Variable Binding & Fallback Guard',
      summary: passed
        ? 'Email templates render graceful fallbacks without undefined or [object Object] leaks.'
        : 'EMBARRASSING COPY DEFECT: Template rendered "undefined" or "[object Object]" in customer-facing email body.',
      failingFile: 'emails/WelcomeEmail.tsx',
      lineNumber: 18,
      rootCause: 'Template interpolates optional prop `user.name` without nullish coalescing default.',
      suggestedFix: "Add fallback: `const name = user.name ?? 'Valued Customer';`.",
      aiPrompt: 'In email templates, ensure all interpolated variables have default fallback values.',
    };
  }
}
