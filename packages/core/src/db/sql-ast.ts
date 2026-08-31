export interface SqlSecurityDefinerIssue {
  functionName: string;
  hasSearchPath: boolean;
  hasTenantCheck: boolean;
  line?: number;
  snippet: string;
  recommendation: string;
}

export interface SqlRlsIssue {
  tableName: string;
  hasRlsEnabled: boolean;
  hasPolicies: boolean;
  missingTenantFilter: boolean;
  recommendation: string;
}

export interface SqlIndexIssue {
  tableName: string;
  columnName: string;
  isForeignKeyOrTenant: boolean;
  hasIndex: boolean;
  recommendation: string;
}

export interface SqlAuditSummary {
  securityDefinerIssues: SqlSecurityDefinerIssue[];
  rlsIssues: SqlRlsIssue[];
  indexIssues: SqlIndexIssue[];
  unindexedTenantQueries: string[];
}

export class SqlAstParser {
  /**
   * Scans SQL schema definitions for SECURITY DEFINER leaks, missing RLS, and missing composite indexes
   */
  static analyzeSchema(sqlSchema: string): SqlAuditSummary {
    const securityDefinerIssues: SqlSecurityDefinerIssue[] = [];
    const rlsIssues: SqlRlsIssue[] = [];
    const indexIssues: SqlIndexIssue[] = [];
    const unindexedTenantQueries: string[] = [];

    const lines = sqlSchema.split('\n');

    // 1. Detect SECURITY DEFINER functions lacking search_path or tenant checks
    const secDefinerRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([a-zA-Z0-9_]+)[\s\S]*?SECURITY\s+DEFINER[\s\S]*?(?:BEGIN|\$\$)/gi;
    let match: RegExpExecArray | null;

    while ((match = secDefinerRegex.exec(sqlSchema)) !== null) {
      const funcName = match[1];
      const funcSnippet = match[0];
      const hasSearchPath = /SET\s+search_path\s*=/i.test(funcSnippet) || /search_path\s+TO/i.test(funcSnippet);
      const hasTenantCheck = /tenant_id|org_id|current_setting/i.test(funcSnippet);

      if (!hasSearchPath || !hasTenantCheck) {
        securityDefinerIssues.push({
          functionName: funcName,
          hasSearchPath,
          hasTenantCheck,
          snippet: funcSnippet.slice(0, 150),
          recommendation: !hasSearchPath
            ? `Add 'SET search_path = public' to FUNCTION ${funcName} to prevent search_path poisoning attacks.`
            : `Ensure FUNCTION ${funcName} verifies caller tenant permissions via current_setting('app.current_tenant_id').`,
        });
      }
    }

    // 2. Detect CREATE TABLE statements without ENABLE ROW LEVEL SECURITY
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_."]+)\s*\(([\s\S]*?)\);/gi;
    while ((match = tableRegex.exec(sqlSchema)) !== null) {
      const tableName = match[1].replace(/["']/g, '');
      const tableBody = match[2];

      const isMultiTenant = /tenant_id|org_id|organization_id|account_id/i.test(tableBody);
      const rlsEnabled = new RegExp(`ALTER\\s+TABLE\\s+${tableName}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i').test(sqlSchema);
      const hasPolicy = new RegExp(`CREATE\\s+POLICY\\s+[a-zA-Z0-9_]+\\s+ON\\s+${tableName}`, 'i').test(sqlSchema);

      if (isMultiTenant && (!rlsEnabled || !hasPolicy)) {
        rlsIssues.push({
          tableName,
          hasRlsEnabled: rlsEnabled,
          hasPolicies: hasPolicy,
          missingTenantFilter: !hasPolicy,
          recommendation: !rlsEnabled
            ? `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`
            : `CREATE POLICY ${tableName}_tenant_isolation ON ${tableName} USING (tenant_id = current_setting('app.current_tenant_id')::uuid);`,
        });
      }

      // Check for index on tenant column
      if (isMultiTenant) {
        const hasTenantIndex = new RegExp(`CREATE\\s+(?:UNIQUE\\s+)?INDEX[\\s\\S]*?ON\\s+${tableName}\\s*\\([^)]*(?:tenant_id|org_id|organization_id)`, 'i').test(sqlSchema);
        if (!hasTenantIndex) {
          indexIssues.push({
            tableName,
            columnName: 'tenant_id',
            isForeignKeyOrTenant: true,
            hasIndex: false,
            recommendation: `CREATE INDEX CONCURRENTLY idx_${tableName}_tenant_created ON ${tableName}(tenant_id, created_at DESC);`,
          });
        }
      }
    }

    return {
      securityDefinerIssues,
      rlsIssues,
      indexIssues,
      unindexedTenantQueries,
    };
  }

  /**
   * Scans a SQL query for missing tenant WHERE clauses or missing LIMITs
   */
  static analyzeQuery(sqlQuery: string): { isSafe: boolean; reasons: string[] } {
    const reasons: string[] = [];
    const lower = sqlQuery.toLowerCase();

    // Check if query selects/updates multi-tenant table without tenant filter
    const isMutation = lower.startsWith('update') || lower.startsWith('delete');
    if (isMutation && !lower.includes('tenant_id') && !lower.includes('org_id') && !lower.includes('current_setting')) {
      reasons.push('Mutation query lacks tenant filter in WHERE clause.');
    }

    if (lower.startsWith('select') && !lower.includes('where') && !lower.includes('limit')) {
      reasons.push('Unbounded SELECT query on potentially large table without LIMIT clause.');
    }

    return {
      isSafe: reasons.length === 0,
      reasons,
    };
  }
}
