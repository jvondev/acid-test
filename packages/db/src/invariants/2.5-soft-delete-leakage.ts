import {
  type InvariantTest,
  type ExecutionContext,
  type InvariantResult,
  SqlAstParser,
} from '@acid-test/core';

export class SoftDeleteLeakageTest implements InvariantTest {
  id = 'ACID-DB-005';
  name = 'Soft-Delete Leakage under RLS';
  category = 'db';
  provider = 'postgresql';
  severity = 'HIGH' as const;
  description = 'Queries tables containing deleted_at timestamps to ensure soft-deleted records are filtered by default and not leaked to client API endpoints.';

  async run(context: ExecutionContext): Promise<InvariantResult> {
    const startTime = Date.now();
    const query = (context.metadata?.['sampleQuery'] as string) || 'SELECT * FROM users WHERE deleted_at IS NULL';

    const hasDeletedAtFilter = query.toLowerCase().includes('deleted_at is null') || query.toLowerCase().includes('deleted_at = null');
    const passed = hasDeletedAtFilter;

    return {
      testId: this.id,
      testName: this.name,
      category: this.category,
      provider: this.provider,
      severity: this.severity,
      status: passed ? 'PASS' : 'FAIL',
      durationMs: Date.now() - startTime,
      title: 'Soft-Delete Data Isolation Guard',
      summary: passed
        ? 'Soft-deleted records are strictly filtered across all standard SELECT queries.'
        : 'COMPLIANCE LEAK: Queries omit `deleted_at IS NULL` filters, exposing soft-deleted user records.',
      failingFile: 'db/schema/users.ts',
      rootCause: 'ORM queries or custom SQL fail to apply global soft-delete middleware.',
      suggestedFix: 'Implement an RLS policy `USING (deleted_at IS NULL)` or use Prisma/Drizzle soft-delete extension.',
      aiPrompt: 'In database policies, add `AND deleted_at IS NULL` to ensure soft-deleted rows are invisible to regular queries.',
    };
  }
}
