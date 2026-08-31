# 02 — Database & Isolation Specification (`@acidtest/db`)

## 1. Scope & Target Engines
This module audits database schemas, transactions, query performance, and Row-Level Security (RLS) multi-tenant policies.

* **Target Engines:** PostgreSQL, Supabase, Neon, PlanetScale, SQLite / Turso.
* **Target ORMs & Query Builders:** Drizzle ORM, Prisma, Kysely, raw SQL.

---

## 2. Exhaustive Non-Happy-Path Invariant Test Matrix

### Test 2.1: Multi-Tenant RLS Penetration Matrix (Cross-Tenant Leak Fuzzer)
* **Adversarial Mechanism:** Connects using an unprivileged application role (`authenticated` / `anon`). Automatically sets session context to `tenant_a` (`SET LOCAL app.current_tenant_id = 'org_alpha'`) and attempts:
  1. `SELECT * FROM table WHERE tenant_id = 'org_beta'`
  2. `UPDATE table SET ... WHERE tenant_id = 'org_beta'`
  3. `DELETE FROM table WHERE tenant_id = 'org_beta'`
  4. Polymorphic joins across tenant tables.
* **Expected Invariant:** 0 rows returned, updated, or deleted across all tables for unowned tenant IDs.
* **Failure Mode Detected:** Missing RLS policies on newly added tables, leaking customer records, financial statements, or private files to competitors.

### Test 2.2: `SECURITY DEFINER` Function & View Leak Auditor
* **Adversarial Mechanism:** Scans all stored procedures, triggers, and views for `SECURITY DEFINER` tags that bypass RLS without hardcoded `WHERE` tenant checks or `search_path` guards.
* **Expected Invariant:** All `SECURITY DEFINER` functions must explicitly bind `search_path = public` and strictly validate caller permissions.
* **Failure Mode Detected:** Privilege escalation where normal users invoke admin-level triggers to mutate unowned records.

### Test 2.3: $N+1$ Query & Missing Composite Index Advisor
* **Adversarial Mechanism:** Analyzes active SQL queries from log dumps or schema AST. Simulates query execution with `EXPLAIN (ANALYZE, BUFFERS)` against populated mock tables ($100k+$ rows).
* **Expected Invariant:** Zero sequential scans (`Seq Scan`) on multi-tenant filtered tables. All tenant lookups must resolve via `Index Scan` or `Bitmap Index Scan`.
* **Failure Mode Detected:** Queries that take 5ms with 10 rows in dev taking 4,500ms in production when tenant data grows, crashing database CPU.

### Test 2.4: Concurrent Deadlock & Isolation Level Stress Fuzzer
* **Adversarial Mechanism:** Spawns 20 parallel transactions executing out-of-order dual-table updates (Transaction A: updates Table 1 then Table 2; Transaction B: updates Table 2 then Table 1) under `READ COMMITTED` and `REPEATABLE READ`.
* **Expected Invariant:** Transactions must not deadlock (`40P01`) or produce dirty reads. State must remain consistent.
* **Failure Mode Detected:** Application hang on concurrent user updates or silent overwrites of conflicting data.

### Test 2.5: Soft-Delete Leakage under RLS
* **Adversarial Mechanism:** Queries tables containing `deleted_at` timestamps using tenant roles.
* **Expected Invariant:** Soft-deleted rows must not be accessible via default `SELECT` queries unless explicit `withDeleted` flags are authenticated.
* **Failure Mode Detected:** GDPR / privacy compliance violation where deleted user data is exposed in API listings.

### Test 2.6: Connection Pool Starvation & Idle Transaction Fuzzer
* **Adversarial Mechanism:** Opens multiple uncommitted transactions that sleep for 10 seconds to test pool exhaustion limits (e.g. PgBouncer / Supabase direct connections).
* **Expected Invariant:** Server-side timeouts (`idle_in_transaction_session_timeout`) must terminate hung transactions before exhausting max client connections for healthy users.
* **Failure Mode Detected:** Complete backend outage when a slow third-party API call freezes a database connection inside an open transaction.

---

## 3. Dual-Layer Report Schema

```json
{
  "module": "db",
  "engine": "postgresql",
  "score": "CRITICAL",
  "security_vulnerabilities": 1,
  "performance_bottlenecks": 3,
  "executive_summary": "CRITICAL SECURITY LEAK: Table `organization_invoices` lacks a Row-Level Security policy. Any authenticated user can read all invoices across all companies.",
  "actionable_sql_remediations": [
    "ALTER TABLE organization_invoices ENABLE ROW LEVEL SECURITY;",
    "CREATE POLICY org_invoices_isolation ON organization_invoices USING (org_id = current_setting('app.current_org_id')::uuid);",
    "CREATE INDEX CONCURRENTLY idx_org_invoices_org_created ON organization_invoices(org_id, created_at DESC);"
  ]
}
```
