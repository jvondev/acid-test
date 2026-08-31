# 09 — Report Engine & Local Studio Specification (`@acid-test/core` & `@acid-test/studio`)

## 1. Scope & Core Objectives
This specification governs how `Acidtest` formats, presents, and exports audit findings across:
1. **Interactive Terminal Output:** Clean, high-density terminal cards (Chalk + Ora spinners + Boxen).
2. **Executive Business Reports:** Plain-English summary, risk score, and estimated monthly financial loss ($/mo).
3. **Machine-Readable AI Remediation Payloads:** Exact reproduction cURL commands, failing source lines, and automated fix prompts for AI coding agents.
4. **Standalone HTML Export:** Single-file, CSS-contained interactive audit report.
5. **Local Web Studio (`localhost:4400`):** Real-time event inspector, visual timeline graphs, and one-click replay.

---

## 2. Terminal UI Standard

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  ACIDTEST v0.1.0 • SYSTEM INTEGRITY & ACID AUDIT REPORT                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  Target: http://localhost:3000 • Database: PostgreSQL (Supabase)            │
│  Timestamp: 2026-08-31 12:30:00 UTC • Duration: 2.4s                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  OVERALL HEALTH GRADE: 🔴 CRITICAL RISK (Score: 62/100)                     │
│  ESTIMATED FINANCIAL EXPOSURE: $4,500 / month                               │
│                                                                             │
│  MODULE BREAKDOWN:                                                          │
│  ✓ Webhook Ingress (HMAC & Buffer):  PASSED (4/4 Invariants)                │
│  ✖ Billing & Idempotency (Stripe):   FAILED (1 Critical Race Condition)     │
│  ✖ Database Isolation (Postgres RLS): FAILED (1 Missing Policy on Invoices) │
│  ✓ Auth & Tenant Separation (Clerk): PASSED (5/5 Invariants)                │
│                                                                             │
│  TOP CRITICAL FINDINGS:                                                     │
│  1. [BILLING] Double Subscription Provisioning on 10ms Duplicate Webhooks   │
│     File: app/api/webhooks/stripe/route.ts:L34                              │
│  2. [DB] Table `organization_invoices` lacks RLS policy (Cross-Tenant Leak) │
│     File: db/schema.ts:L88                                                  │
│                                                                             │
│  📄 Full HTML Report: .acidtest/reports/audit-2026-08-31.html               │
│  🤖 AI Fix Prompt:    .acidtest/remediation.prompt.md                      │
│  🌐 Open Studio:      npx @acid-test/cli studio                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Financial Risk Calculation Formula

`Acidtest` calculates an estimated monthly dollar-risk exposure based on discovered failure modes:

$$\text{Monthly Risk (\$)} = (\text{Avg Transaction Value} \times \text{Est. Failure Probability} \times \text{Monthly Volume}) + \text{Compliance Penalty Risk}$$

* **Race Condition on Payment Webhook:** $\approx \$4,500/\text{mo}$ (assumes 1% double-charge or uncollected revenue risk on $450k GMV).
* **Missing RLS Policy (Data Leak):** $\approx \$25,000$ (statutory GDPR/security incident liability estimate).
* **Unindexed $N+1$ Table Scan:** $\approx \$800/\text{mo}$ in unnecessary database compute scaling tiers.

---

## 4. Machine-Readable AI Remediation Schema (`.acidtest/remediation.json`)

```json
{
  "version": "1.0",
  "audit_timestamp": "2026-08-31T12:30:00Z",
  "issues": [
    {
      "id": "ACID-BILLING-001",
      "severity": "CRITICAL",
      "title": "Non-Idempotent Webhook Processing (Double Credit)",
      "failing_file": "app/api/webhooks/stripe/route.ts",
      "line_number": 34,
      "reproduction_command": "npx @acid-test/cli billing --fuzz burst --concurrency 10",
      "root_cause": "Database insert lacks a unique constraint or distributed lock on `stripe_event_id`.",
      "ai_prompt": "Refactor app/api/webhooks/stripe/route.ts: Wrap the checkout completion logic in a PostgreSQL transaction and add an ON CONFLICT (stripe_event_id) DO NOTHING clause to prevent duplicate insertions."
    }
  ]
}
```
