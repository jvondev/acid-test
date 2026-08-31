import {
  type InvariantTest,
  type ExecutionContext,
  type InvariantResult,
  SqlAstParser,
} from '@acid-test/core';

export class SecurityDefinerLeakTest implements InvariantTest {
  id = 'ACID-DB-002';
  name = 'SECURITY DEFINER Function & View Leak Auditor';
  category = 'db';
  provider = 'postgresql';
  severity = 'CRITICAL' as const;
  description = 'Scans database procedures and triggers for SECURITY DEFINER tags bypassing RLS without search_path guards or caller permission checks.';

  async run(context: ExecutionContext): Promise<InvariantResult> {
    const startTime = Date.now();
    const schemaSql = (context.metadata?.['schemaSql'] as string) || `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        INSERT INTO public.profiles (id, full_name, avatar_url)
        VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
        RETURN new;
      END;
      $$;
    `;

    const summary = SqlAstParser.analyzeSchema(schemaSql);
    const issues = summary.securityDefinerIssues;
    const passed = issues.length === 0;

    return {
      testId: this.id,
      testName: this.name,
      category: this.category,
      provider: this.provider,
      severity: this.severity,
      status: passed ? 'PASS' : 'FAIL',
      durationMs: Date.now() - startTime,
      title: 'SECURITY DEFINER Search-Path & Permission Guard',
      summary: passed
        ? 'All SECURITY DEFINER routines contain explicit `SET search_path = public` and parameter guards.'
        : `Detected ${issues.length} vulnerable SECURITY DEFINER function(s) susceptible to search_path hijacking or RLS bypass.`,
      details: issues.map((i) => `${i.functionName}: ${i.recommendation}`).join('; '),
      failingFile: 'db/functions/triggers.sql',
      rootCause: 'Function declared as SECURITY DEFINER executes with owner privileges without fixing search_path.',
      suggestedFix: 'Append `SET search_path = public` to the function declaration.',
      aiPrompt: 'In your PostgreSQL stored procedures, ensure all SECURITY DEFINER functions explicitly declare `SET search_path = public`.',
    };
  }
}
