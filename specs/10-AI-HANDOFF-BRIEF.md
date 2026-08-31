# Context & Architecture Brief: Acidtest Backend Reliability & Chaos Suite

### 1. System Overview & Architecture
`Acidtest` is an adversarial reliability, security, and chaos-testing suite engineered to audit modern distributed web backends against the foundational laws of **Atomicity**, **Consistency**, **Isolation**, and **Durability (ACID)**.

It is structured as a high-performance TypeScript monorepo managed with **pnpm workspaces + Turborepo**:

* **Root Location:** [`D:\jvondev\acidtest`](file:///D:/jvondev/acidtest)
* **Execution Harness:** `@acidtest/cli` (Global terminal runner with domain commands and platform aliases: `billing`/`stripe`, `db`/`pg`, `auth`/`clerk`, `queue`/`bullmq`, `webhook`, `ai`, `email`, `storage`).
* **Core Systems Engine:** `@acidtest/core` (Cryptographic HMAC recalculation, concurrent burst fuzzer with microsecond jitter, SQL AST parser, dual-layer reporting engine).
* **Domain Modules:** Dedicated packages under `packages/` (`billing`, `db`, `auth`, `queue`, `webhook`, `ai`, `email`, `storage`).
* **Visual Web Studio:** `apps/studio` (Local zero-config web dashboard on `localhost:4400`).

---

### 2. Current Observed Behaviors & Visual/Technical Friction

#### The Problem with Existing Developer Tools:
1. **The "Happy Path" Fallacy:** Most audit tools test APIs with valid, sequential payloads. In production, real financial disasters happen when 2 duplicate webhooks arrive in 5ms, when transactions fail halfway through a 3-step action, or when an RLS policy is omitted on a single analytics table.
2. **The "Passive Inspector" Commodity:** Building a tool that simply *displays* incoming JSON logs is a 10-minute commodity with zero moat. `Acidtest` actively executes **adversarial chaos injection**, **microsecond concurrent burst fuzzing**, and **multi-system ledger reconciliation**.
3. **The Communication Gap:** Technical logs confuse non-technical founders; high-level summaries are useless to engineers. `Acidtest` solves this with a **Dual-Layer Report Engine**:
   - **Layer 1 (Executive):** Plain-English diagnosis, pass/fail grade, and estimated monthly financial loss ($/mo).
   - **Layer 2 (Engineering & AI):** Exact reproduction cURL bursts, failing SQL query traces, and ready-to-use AI remediation prompts.

---

### 3. Spatial & Execution Model

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ACIDTEST EXECUTION TOPOLOGY                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. TARGET INGRESS & HARNESS                                                │
│     npx @acidtest/cli <module> [--url | --db | --redis | --fuzz]            │
│                              │                                              │
│  2. ADVERSARIAL INVARIANT ENGINE (@acidtest/core)                           │
│     ├── Concurrent Burst Fuzzer (Worker threads, 0–25ms jitter)             │
│     ├── Time-Travel Lifecycle Sequencer (Synthetic multi-state events)      │
│     ├── Multi-Provider Cryptographic Auto-Signer (Raw-buffer HMAC)          │
│     └── SQL AST & Multi-Tenant Role Impersonator                            │
│                              │                                              │
│  3. DUAL-LAYER REPORT & ARTIFACT GENERATOR                                  │
│     ├── Terminal UI (Chalk / Ora / Boxen summary cards)                     │
│     ├── Executive HTML Report (.acidtest/reports/audit-[timestamp].html)    │
│     ├── Local Visual Studio (localhost:4400)                                │
│     └── Machine-Readable AI Remediation (.acidtest/remediation.json)        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 4. Rejected Approaches & Failed Band-Aids (Graveyard of Failed Attempts)

1. **Rejected: Passive Webhook Proxy / Inspector**
   - *Why Rejected:* Passive request logging is a commodity easily scaffolded in 5 minutes by LLMs. Provides zero proprietary moat and does not actively detect race conditions or security leaks.
2. **Rejected: Standalone Heavy Desktop-Only Binary**
   - *Why Rejected:* Asking developers to download a 120MB Electron app just to audit a webhook creates massive adoption friction. The `npx @acidtest/cli` model gives instant zero-install execution in under 1 second.
3. **Rejected: Fragmented Multi-Repo Repositories**
   - *Why Rejected:* Creating 5 separate GitHub repos (`stripe-tester`, `pg-guard`, `queue-chaos`) creates massive maintenance fatigue and dilutes brand authority. The single Monorepo with modular packages provides 10x engineering leverage.
4. **Rejected: Single-Provider Locked Naming**
   - *Why Rejected:* Naming a tool only `stripe-chaos` renders it useless when a client uses Paddle or LemonSqueezy. Domain-first commands (`billing`, `db`, `auth`) with platform aliases (`stripe`, `pg`, `clerk`) ensure universal applicability.

---

### 5. Artifact & Code References

* **Universal Operating Rules:** [`AGENTS.md`](file:///D:/jvondev/freelance/AGENTS.md)
* **Master Architecture Specification:** [`specs/00-MASTER-ARCHITECTURE.md`](file:///D:/jvondev/acidtest/specs/00-MASTER-ARCHITECTURE.md)
* **Billing & Financial Invariant Spec:** [`specs/01-BILLING-SPEC.md`](file:///D:/jvondev/acidtest/specs/01-BILLING-SPEC.md)
* **Database & RLS Isolation Spec:** [`specs/02-DATABASE-SPEC.md`](file:///D:/jvondev/acidtest/specs/02-DATABASE-SPEC.md)
* **Auth & Identity Spec:** [`specs/03-AUTH-IDENTITY-SPEC.md`](file:///D:/jvondev/acidtest/specs/03-AUTH-IDENTITY-SPEC.md)
* **Queue & Worker Chaos Spec:** [`specs/04-QUEUE-CHAOS-SPEC.md`](file:///D:/jvondev/acidtest/specs/04-QUEUE-CHAOS-SPEC.md)
* **Webhook Ingress Spec:** [`specs/05-WEBHOOK-INGRESS-SPEC.md`](file:///D:/jvondev/acidtest/specs/05-WEBHOOK-INGRESS-SPEC.md)
* **AI Gateway & Streaming Spec:** [`specs/06-AI-GATEWAY-SPEC.md`](file:///D:/jvondev/acidtest/specs/06-AI-GATEWAY-SPEC.md)
* **Email & Communication Spec:** [`specs/07-EMAIL-COMMUNICATION-SPEC.md`](file:///D:/jvondev/acidtest/specs/07-EMAIL-COMMUNICATION-SPEC.md)
* **Storage & Blob Security Spec:** [`specs/08-STORAGE-BLOB-SPEC.md`](file:///D:/jvondev/acidtest/specs/08-STORAGE-BLOB-SPEC.md)
* **Report Engine & Studio Spec:** [`specs/09-REPORT-STUDIO-SPEC.md`](file:///D:/jvondev/acidtest/specs/09-REPORT-STUDIO-SPEC.md)
* **Master Handoff Brief:** [`specs/10-AI-HANDOFF-BRIEF.md`](file:///D:/jvondev/acidtest/specs/10-AI-HANDOFF-BRIEF.md)
* **Package Root:** [`package.json`](file:///D:/jvondev/acidtest/package.json)
