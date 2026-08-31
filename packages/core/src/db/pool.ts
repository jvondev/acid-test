import { ExplainAnalyzer, type ExplainNode, type ExplainAnalyzeResult } from './explain.js';
import { DbPenetrationTester } from './penetration.js';

export * from './explain.js';
export * from './penetration.js';

export class ConnectionPoolHarness {
  private dbUrl?: string;

  constructor(dbUrl?: string) {
    this.dbUrl = dbUrl;
  }

  async query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number }> {
    if (!this.dbUrl) throw new Error('Database URL is required to execute query.');
    const pg = await import('pg');
    const pool = new pg.Pool({ connectionString: this.dbUrl, max: 2, connectionTimeoutMillis: 5000 });
    try {
      const client = await pool.connect();
      try {
        const res = await client.query(sql, params);
        return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 };
      } finally {
        client.release();
      }
    } finally {
      await pool.end();
    }
  }

  static parseExplainPlan(planJson: unknown): ExplainAnalyzeResult {
    return ExplainAnalyzer.parse(planJson);
  }

  async runExplainAnalyze(query: string): Promise<ExplainAnalyzeResult> {
    if (!this.dbUrl) throw new Error('Database URL is required for live EXPLAIN ANALYZE.');
    const pg = await import('pg');
    const pool = new pg.Pool({ connectionString: this.dbUrl, max: 2, connectionTimeoutMillis: 5000 });
    try {
      const client = await pool.connect();
      try {
        const res = await client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`);
        return ExplainAnalyzer.parse(res.rows[0]['QUERY PLAN']);
      } finally {
        client.release();
      }
    } finally {
      await pool.end();
    }
  }

  async testRlsPenetration(options: {
    tenantA: string;
    tenantB: string;
    targetTable: string;
    tenantColumn?: string;
  }) {
    if (!this.dbUrl) throw new Error('Database URL is required for live RLS penetration audit.');
    return DbPenetrationTester.testRlsPenetration(this.dbUrl, options);
  }

  async testDeadlockResolution(options: {
    table1: string;
    table2: string;
    rowId1: string | number;
    rowId2: string | number;
  }) {
    if (!this.dbUrl) throw new Error('Database URL is required for live deadlock fuzzing.');
    return DbPenetrationTester.testDeadlockResolution(this.dbUrl, options);
  }
}
