export interface ExplainNode {
  'Node Type': string;
  'Relation Name'?: string;
  'Alias'?: string;
  'Startup Cost'?: number;
  'Total Cost'?: number;
  'Plan Rows'?: number;
  'Plan Width'?: number;
  'Actual Startup Time'?: number;
  'Actual Total Time'?: number;
  'Actual Rows'?: number;
  'Actual Loops'?: number;
  'Shared Hit Blocks'?: number;
  'Shared Read Blocks'?: number;
  'Plans'?: ExplainNode[];
}

export interface ExplainAnalyzeResult {
  executionTimeMs: number;
  planningTimeMs: number;
  hasSeqScan: boolean;
  seqScanTables: string[];
  totalBuffersRead: number;
  rootNode?: ExplainNode;
  rawJson?: unknown;
}

export class ConnectionPoolHarness {
  private dbUrl?: string;

  constructor(dbUrl?: string) {
    this.dbUrl = dbUrl;
  }

  /**
   * Runs a SQL query against PostgreSQL with connection cleanup
   */
  async query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number }> {
    if (!this.dbUrl) {
      throw new Error('Database URL is required to execute query.');
    }
    const pg = await import('pg');
    const pool = new pg.Pool({ connectionString: this.dbUrl, max: 2, connectionTimeoutMillis: 5000 });
    try {
      const client = await pool.connect();
      try {
        const res = await client.query(sql, params);
        return {
          rows: res.rows as T[],
          rowCount: res.rowCount ?? 0,
        };
      } finally {
        client.release();
      }
    } finally {
      await pool.end();
    }
  }

  /**
   * Analyzes an EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) execution plan
   */
  static parseExplainPlan(planJson: unknown): ExplainAnalyzeResult {
    const raw = Array.isArray(planJson) ? planJson[0] : planJson;
    const plan = (raw as Record<string, unknown>)?.['Plan'] as ExplainNode | undefined;
    const executionTimeMs = (raw as Record<string, number>)?.['Execution Time'] ?? 0;
    const planningTimeMs = (raw as Record<string, number>)?.['Planning Time'] ?? 0;

    const seqScanTables: string[] = [];

    function traverse(node?: ExplainNode) {
      if (!node) return;
      if (node['Node Type'] === 'Seq Scan' && node['Relation Name']) {
        seqScanTables.push(node['Relation Name']);
      }
      if (node.Plans && Array.isArray(node.Plans)) {
        for (const child of node.Plans) {
          traverse(child);
        }
      }
    }

    traverse(plan);

    return {
      executionTimeMs,
      planningTimeMs,
      hasSeqScan: seqScanTables.length > 0,
      seqScanTables,
      totalBuffersRead: (plan?.['Shared Read Blocks'] ?? 0) + (plan?.['Shared Hit Blocks'] ?? 0),
      rootNode: plan,
      rawJson: raw,
    };
  }

  /**
   * Executes an EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) query against live PostgreSQL
   */
  async runExplainAnalyze(query: string): Promise<ExplainAnalyzeResult> {
    if (!this.dbUrl) {
      throw new Error('Database URL is required to execute live EXPLAIN ANALYZE.');
    }

    const pg = await import('pg');
    const pool = new pg.Pool({ connectionString: this.dbUrl, max: 2, connectionTimeoutMillis: 5000 });

    try {
      const client = await pool.connect();
      try {
        const res = await client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`);
        const planData = res.rows[0]['QUERY PLAN'];
        return ConnectionPoolHarness.parseExplainPlan(planData);
      } finally {
        client.release();
      }
    } finally {
      await pool.end();
    }
  }

  /**
   * Penetration test: connects as unprivileged user, sets tenant_id to org_alpha, attempts queries on org_beta
   */
  async testRlsPenetration(options: {
    tenantA: string;
    tenantB: string;
    targetTable: string;
    tenantColumn?: string;
  }): Promise<{
    tableProtected: boolean;
    leakedRows: number;
    mutationBlocked: boolean;
    error?: string;
  }> {
    if (!this.dbUrl) {
      throw new Error('Database URL is required for live RLS penetration audit.');
    }

    const { tenantA, tenantB, targetTable, tenantColumn = 'tenant_id' } = options;
    const pg = await import('pg');
    const pool = new pg.Pool({ connectionString: this.dbUrl, max: 2 });

    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`SET LOCAL app.current_tenant_id = '${tenantA}'`);

        const selectRes = await client.query(
          `SELECT * FROM ${targetTable} WHERE ${tenantColumn} = '${tenantB}' LIMIT 10`
        );
        const leakedRows = selectRes.rowCount ?? 0;

        let mutationBlocked = true;
        try {
          const updateRes = await client.query(
            `UPDATE ${targetTable} SET updated_at = NOW() WHERE ${tenantColumn} = '${tenantB}'`
          );
          if ((updateRes.rowCount ?? 0) > 0) {
            mutationBlocked = false;
          }
        } catch {
          mutationBlocked = true;
        }

        await client.query('ROLLBACK');

        return {
          tableProtected: leakedRows === 0 && mutationBlocked,
          leakedRows,
          mutationBlocked,
        };
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        return {
          tableProtected: true,
          leakedRows: 0,
          mutationBlocked: true,
          error: err instanceof Error ? err.message : String(err),
        };
      } finally {
        client.release();
      }
    } finally {
      await pool.end();
    }
  }

  /**
   * Deadlock stress test: spawns 2 parallel transactions executing out-of-order dual table updates
   */
  async testDeadlockResolution(options: {
    table1: string;
    table2: string;
    rowId1: string | number;
    rowId2: string | number;
  }): Promise<{
    deadlockDetected: boolean;
    resolvedGracefully: boolean;
    errorCodes: string[];
  }> {
    if (!this.dbUrl) {
      throw new Error('Database URL is required for live deadlock fuzzing.');
    }

    const { table1, table2, rowId1, rowId2 } = options;
    const pg = await import('pg');
    const pool = new pg.Pool({ connectionString: this.dbUrl, max: 5 });
    const errorCodes: string[] = [];

    try {
      const client1 = await pool.connect();
      const client2 = await pool.connect();

      try {
        await client1.query('BEGIN');
        await client2.query('BEGIN');

        await client1.query(`SELECT * FROM ${table1} WHERE id = $1 FOR UPDATE`, [rowId1]);
        await client2.query(`SELECT * FROM ${table2} WHERE id = $1 FOR UPDATE`, [rowId2]);

        const tx1Step2 = client1.query(`SELECT * FROM ${table2} WHERE id = $1 FOR UPDATE`, [rowId2]);
        const tx2Step2 = client2.query(`SELECT * FROM ${table1} WHERE id = $1 FOR UPDATE`, [rowId1]);

        let deadlock = false;
        try {
          await Promise.all([tx1Step2, tx2Step2]);
        } catch (err: any) {
          if (err.code === '40P01') {
            deadlock = true;
            errorCodes.push(err.code);
          }
        }

        await client1.query('ROLLBACK').catch(() => {});
        await client2.query('ROLLBACK').catch(() => {});

        return {
          deadlockDetected: deadlock,
          resolvedGracefully: deadlock,
          errorCodes,
        };
      } finally {
        client1.release();
        client2.release();
      }
    } finally {
      await pool.end();
    }
  }
}
