import { describe, it, expect } from 'vitest';
import { SqlAstParser } from '../src/db/sql-ast.js';

describe('SqlAstParser', () => {
  it('detects SECURITY DEFINER function missing search_path', () => {
    const vulnerableSql = `
      CREATE OR REPLACE FUNCTION update_user_balance()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        UPDATE balances SET amount = amount + 10;
      END;
      $$;
    `;

    const summary = SqlAstParser.analyzeSchema(vulnerableSql);
    expect(summary.securityDefinerIssues.length).toBeGreaterThan(0);
    expect(summary.securityDefinerIssues[0].hasSearchPath).toBe(false);
  });

  it('detects multi-tenant table missing ENABLE ROW LEVEL SECURITY', () => {
    const vulnerableSchema = `
      CREATE TABLE customer_orders (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL,
        amount INT NOT NULL
      );
    `;

    const summary = SqlAstParser.analyzeSchema(vulnerableSchema);
    expect(summary.rlsIssues.length).toBeGreaterThan(0);
    expect(summary.rlsIssues[0].hasRlsEnabled).toBe(false);
    expect(summary.indexIssues.length).toBeGreaterThan(0);
  });
});
