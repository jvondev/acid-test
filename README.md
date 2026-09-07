<a id="readme-top"></a>

<div align="center">

# acidtest

**Adversarial backend reliability, database integrity, and chaos testing.**

Automated resilience suite auditing distributed backends against ACID invariants, webhook race conditions, multi-tenant database leaks, and worker failures.

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.4-ef4444.svg)](https://turbo.build/)
[![Vitest](https://img.shields.io/badge/Vitest-3.0-6e9f18.svg)](https://vitest.dev/)
[![GitHub stars](https://img.shields.io/github/stars/jvondev/acidtest?style=social)](https://github.com/jvondev/acidtest)

<br/>

[Overview](#overview) &nbsp;•&nbsp;
[Quickstart](#quickstart) &nbsp;•&nbsp;
[Audit Modules](#audit-modules) &nbsp;•&nbsp;
[What This Looks Like](#what-this-looks-like) &nbsp;•&nbsp;
[Terminal UI & Studio](#terminal-ui--studio) &nbsp;•&nbsp;
[Architecture](#architecture) &nbsp;•&nbsp;
[License](#license)

<br/><br/>

<img src="assets/hero-splash.png" alt="acidtest initializing gate and rain matrix engine" width="100%" />

</div>

<br/>

> [!NOTE]
> Maintained by [jvondev](https://github.com/jvondev). Built for engineering teams, financial platforms, and distributed systems that require empirical proof of transaction boundaries, isolation levels, and idempotency guarantees before shipping to production.

---

## Overview

Modern cloud architectures fail at the boundaries between distributed components: asynchronous webhooks, background worker queues, database connection pools, and third-party payment gateways. 

Standard unit and integration tests verify the happy path, but real production systems encounter network retries, microsecond race conditions, out-of-order deliveries, and unhandled abort signals.

`acidtest` is a specialized, zero-overhead adversarial audit engine. It injects deterministic chaos and fuzzed payloads directly into local or staging services to empirically verify that system state remains **Atomic**, **Consistent**, **Isolated**, and **Durable**.

---

## What You Get

* **Concurrent Burst Fuzzing:** Blast webhook ingresses and checkout endpoints with microsecond-jitter race condition bursts to detect double-fulfillment.
* **RLS and Multi-Tenant Audit:** Mathematically verify Postgres and Supabase row-level security policies to detect cross-tenant data leakage.
* **Billing and Ledger Idempotency:** Audit Stripe, LemonSqueezy, and Paddle workflows against network retries, dunning loops, and partial state mutations.
* **Queue Chaos Runner:** Stress BullMQ and SQS background workers with poison-pill payloads, process SIGKILL drops, and retry backoff storms.
* **HMAC and Timing Defense:** Detect stringified JSON tampering, expired timestamp acceptance, and non-constant-time signature comparisons.
* **AI Gateway Resilience:** Audit streaming Server-Sent Events (SSE) abort handling, structured output schema drift, and 429 backpressure recovery.
* **Dual Cockpit Interfaces:** Run fast terminal sweeps in an interactive Fullscreen Terminal UI (TUI) or inspect traces in the local Web Studio on port 4400.

---

## Quickstart

Run a zero-install audit against your local application server:

```bash
# Zero-install execution via npx
npx acidtest audit --url http://localhost:3000

# Or install globally
pnpm add -g @acid-test/cli
```

> [!TIP]
> In CI/CD pipelines, pass the `--ci` flag to enforce strict exit codes (exit code 1 on any invariant failure) and output machine-readable JSON reports.

### Common CLI Commands

```bash
# Audit billing and payment webhooks against race conditions
acidtest billing --url http://localhost:3000/api/webhooks/stripe --secret whsec_test

# Audit PostgreSQL Row Level Security (RLS) policies
acidtest db --db "postgresql://postgres:postgres@localhost:5432/app_db"

# Audit background workers against poison pills and crash recovery
acidtest queue --redis "redis://localhost:6379"

# Launch the interactive full-screen Terminal UI (TUI)
acidtest tui

# Launch the local visual Web Studio on port 4400
acidtest studio
```

---

## Audit Modules

`acidtest` provides dedicated testing engines tailored to each distributed infrastructure domain:

| Domain | Target Systems | Core Failure Modes Audited |
|:-------|:---------------|:---------------------------|
| **Billing** | Stripe, LemonSqueezy, Paddle | Double checkout completion, mutated invoice replay, fractional currency rounding, dunning time-travel |
| **Database** | PostgreSQL, Supabase, Neon | RLS tenant-hopping, SECURITY DEFINER privilege leaks, N+1 query locks, transaction deadlock isolation |
| **Webhooks** | Shopify, Slack, GitHub, Svix | Stringified JSON vs raw-buffer HMAC bypass, timestamp replay tolerance, timing-attack vulnerabilities |
| **Queues** | BullMQ, AWS SQS | Poison-pill handling, stalled job recovery after SIGKILL, exponential retry backoff, lock lease expiration |
| **Auth** | Clerk, NextAuth, Auth0, WorkOS | Session token replay after logout, `alg: none` JWT spoofing, mass assignment privilege escalation |
| **AI Gateway** | OpenAI, Anthropic, Gemini | Premature SSE stream disconnects, structured JSON schema parsing poisoning, rate-limit backpressure |
| **Storage** | AWS S3, Cloudflare R2 | Presigned URL expiration tampering, MIME magic-byte spoofing, public ACL read exposure |
| **Email** | Resend, Postmark, SendGrid | Missing template parameter fallbacks, broken link anchors, spam score pre-flight validation |

---

## What This Looks Like

### 1. Interactive Terminal Cockpit and Code Inspector

The CLI features an interactive full-screen terminal interface with keyboard navigation, live invariant auditing across 10 domains, and automated AST code diff generation:

<img src="assets/terminal-cockpit.png" alt="acidtest interactive terminal cockpit and code diff inspector" width="100%" />

*Interactive cockpit auditing 35 invariants in real time, displaying inline code diffs for failed boundary checks with copy-pasteable AI fix prompts.*

### 2. Vulnerable vs Hardened Webhook Handling

<table>
<tr>
<th align="left">Vulnerable Webhook Handler</th>
<th align="left">Hardened with ACID Invariants</th>
</tr>
<tr>
<td valign="top">

```typescript
// FAILS: Invariant 1.1 & 1.3
app.post("/webhook", async (req, res) => {
  const event = req.body;
  
  // Vulnerable to stringified JSON HMAC mismatch
  // Vulnerable to duplicate bursts without idempotency lock
  if (event.type === "checkout.session.completed") {
    await fulfillOrder(event.data.object);
  }
  
  res.json({ received: true });
});
```

<em>Vulnerable to race conditions where simultaneous webhook retries trigger double fulfillments.</em>

</td>
<td valign="top">

```typescript
// PASSES: Invariant 1.1 & 1.3
app.post("/webhook", rawBodyMiddleware, async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const event = stripe.webhooks.constructEvent(
    req.rawBody, sig, endpointSecret
  );

  // Idempotent lock via database transaction
  const locked = await db.acquireIdempotencyKey(event.id);
  if (!locked) return res.status(200).json({ duplicate: true });

  await db.transaction(async (tx) => {
    await fulfillOrder(event.data.object, tx);
  });

  res.json({ received: true });
});
```

<em>Enforces raw-buffer signature verification and atomic database idempotency keys.</em>

</td>
</tr>
</table>

### 3. Verification and Chaos Pipeline

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#1e293b', 'primaryBorderColor': '#38bdf8', 'primaryTextColor': '#f8fafc', 'lineColor': '#38bdf8'}}}%%
flowchart LR
    A[Target Endpoint] --> B[Burst Fuzzer]
    B --> C{Deterministic Invariants}
    C -->|Idempotency| D[State Ledger Audit]
    C -->|Concurrency| E[Race Condition Detector]
    C -->|Isolation| F[RLS Penetration Probe]
    D --> G[Unified Risk Scorecard]
    E --> G
    F --> G
    G --> H[Terminal UI / Web Studio]
```

### 4. Monorepo Architecture

```text
acidtest/
├── apps/
│   └── studio/              # Local zero-config visual dashboard (Port 4400)
├── packages/
│   ├── ai/                  # SSE streams, prompt fuzzing, and schema drift
│   ├── auth/                # Session token replay and JWT alg:none attacks
│   ├── billing/             # Stripe, LemonSqueezy, and Paddle idempotency
│   ├── cli/                 # Terminal UI, Ink components, and command runner
│   ├── core/                # Raw-buffer fuzzers, HMAC crypto, and risk models
│   ├── db/                  # PostgreSQL AST parser, RLS fuzzer, and deadlocks
│   ├── email/               # Transactional email parameters and link checks
│   ├── queue/               # BullMQ and SQS poison-pill and SIGKILL simulations
│   ├── storage/             # S3 and Cloudflare R2 presigned URL verification
│   └── webhook/             # Constant-time comparison and timestamp tolerance
└── specs/                   # Formal architectural specifications and invariants
```

---

## Terminal UI & Studio

`acidtest` delivers insights through two complementary interfaces:

### Interactive Terminal Cockpit
Launch the full-screen terminal cockpit with:
```bash
acidtest tui
```
Navigate test suites, inspect raw network request payloads, view AST SQL explanations, and generate copy-pasteable code fixes directly in your terminal.

### Local Visual Web Studio
Launch the browser-based dashboard with:
```bash
acidtest studio
```
Spins up a lightweight local server on `http://localhost:4400` with visual timing waterfalls, database lock flamegraphs, and team-ready exportable audit reports.

---

## Configuration

<details>
<summary><b>Sample <code>acidtest.config.json</code></b></summary>

Create an optional `acidtest.config.json` in your repository root to configure targets and thresholds:

```json
{
  "target": {
    "url": "http://localhost:3000",
    "timeoutMs": 5000
  },
  "fuzzer": {
    "concurrency": 15,
    "jitterMs": 5,
    "retries": 3
  },
  "database": {
    "connectionString": "env:DATABASE_URL",
    "enforceRls": true
  },
  "financial": {
    "monthlyGmvUsd": 50000,
    "averageTicketSizeUsd": 120
  },
  "reporters": ["terminal", "html"]
}
```

</details>

---

## Contributing

Contributions are welcome. Please ensure all pull requests pass typechecking, linting, and existing test suites:

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

---

## License

MIT © [jvondev](https://github.com/jvondev)

<div align="center">

<a href="#readme-top">↑ back to top</a>

</div>
