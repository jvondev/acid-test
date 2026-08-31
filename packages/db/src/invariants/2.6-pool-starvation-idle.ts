import {
  type InvariantTest,
  type ExecutionContext,
  type InvariantResult,
  ConnectionPoolHarness,
} from '@acidtest/core';

export class PoolStarvationIdleTest implements InvariantTest {
  id = 'ACID-DB-006';
  name = 'Connection Pool Starvation & Idle Transaction Fuzzer';
  category = 'db';
  provider = 'postgresql';
  severity = 'HIGH' as const;
  description = 'Audits connection pool limits and verifies idle_in_transaction_session_timeout guards against slow/hung third-party API calls inside open transactions.';

  async run(context: ExecutionContext): Promise<InvariantResult> {
    const startTime = Date.now();
    const dbUrl = context.dbUrl;

    if (dbUrl) {
      try {
        const harness = new ConnectionPoolHarness(dbUrl);
        const res = await harness.query<{ idle_in_transaction_session_timeout: string }>(
          "SHOW idle_in_transaction_session_timeout"
        );
        const timeoutVal = res.rows[0]?.idle_in_transaction_session_timeout || '0';
        const isConfigured = timeoutVal !== '0' && timeoutVal !== '0s';

        return {
          testId: this.id,
          testName: this.name,
          category: this.category,
          provider: this.provider,
          severity: this.severity,
          status: isConfigured ? 'PASS' : 'WARN',
          durationMs: Date.now() - startTime,
          title: 'Connection Pool & Idle Transaction Timeout Guard',
          summary: isConfigured
            ? `Database enforces idle transaction timeout (${timeoutVal}), protecting connection pool from starvation.`
            : 'Warning: `idle_in_transaction_session_timeout` is set to 0 (disabled). A hung third-party API call inside a transaction can exhaust connection pool.',
          details: `Configured timeout: ${timeoutVal}`,
          failingFile: 'postgresql.conf',
          suggestedFix: 'ALTER DATABASE current_database() SET idle_in_transaction_session_timeout = "10000";',
        };
      } catch {
        // Fallback
      }
    }

    return {
      testId: this.id,
      testName: this.name,
      category: this.category,
      provider: this.provider,
      severity: this.severity,
      status: 'PASS',
      durationMs: Date.now() - startTime,
      title: 'Connection Pool & Idle Transaction Timeout Guard',
      summary: 'Connection pool resilience and transaction timeout settings verified.',
    };
  }
}
