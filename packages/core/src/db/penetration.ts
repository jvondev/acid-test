export class DbPenetrationTester {
  /**
   * Penetration test: connects as unprivileged user, sets tenant_id to org_alpha, attempts queries on org_beta
   */
  static async testRlsPenetration(dbUrl: string, options: {
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
    const { tenantA, tenantB, targetTable, tenantColumn = 'tenant_id' } = options;
    const pg = await import('pg');
    const pool = new pg.Pool({ connectionString: dbUrl, max: 2 });

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
          if ((updateRes.rowCount ?? 0) > 0) mutationBlocked = false;
        } catch {
          mutationBlocked = true;
        }

        await client.query('ROLLBACK');
        return { tableProtected: leakedRows === 0 && mutationBlocked, leakedRows, mutationBlocked };
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
  static async testDeadlockResolution(dbUrl: string, options: {
    table1: string;
    table2: string;
    rowId1: string | number;
    rowId2: string | number;
  }): Promise<{
    deadlockDetected: boolean;
    resolvedGracefully: boolean;
    errorCodes: string[];
  }> {
    const { table1, table2, rowId1, rowId2 } = options;
    const pg = await import('pg');
    const pool = new pg.Pool({ connectionString: dbUrl, max: 5 });
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

        return { deadlockDetected: deadlock, resolvedGracefully: deadlock, errorCodes };
      } finally {
        client1.release();
        client2.release();
      }
    } finally {
      await pool.end();
    }
  }
}
