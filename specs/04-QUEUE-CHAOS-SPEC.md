# 04 — Distributed Queue & Worker Chaos Specification (`@acidtest/queue`)

## 1. Scope & Target Engines
This module audits background job queues, message brokers, and worker processes against crash loops, memory leaks, poison pills, and retry storms.

* **Target Queue Engines:** BullMQ, Redis Streams, AWS SQS, Upstash QStash, Temporal.
* **Target Worker Runtime:** Node.js, TypeScript, Bun, Python worker pools.

---

## 2. Exhaustive Non-Happy-Path Invariant Test Matrix

### Test 4.1: Poison-Pill Injection & Dead-Letter Queue (DLQ) Guard
* **Adversarial Mechanism:** Injects corrupted payloads into the queue:
  1. Deeply nested circular JSON structures
  2. Strings containing null bytes (`\u0000`)
  3. Massive 5MB payloads
  4. Missing mandatory schema properties
* **Expected Invariant:** The worker process must catch parsing/validation errors, mark the job as failed, route it to the Dead-Letter Queue (DLQ) after configured retries, and **continue processing subsequent jobs without crashing**.
* **Failure Mode Detected:** A single bad message crashes the worker process. The worker restarts, picks up the same poison message, and crashes again (infinite restart death spiral).

### Test 4.2: Worker SIGKILL mid-Execution (Stalled Job Recovery)
* **Adversarial Mechanism:** Starts processing a multi-step job (e.g. invoice generation), sends a `SIGKILL` to the worker process halfway through execution, and monitors the queue.
* **Expected Invariant:** The queue manager (BullMQ / SQS) must detect the stalled lock, release the job lock after visibility timeout, and allow a replacement worker to resume processing idempotently.
* **Failure Mode Detected:** Stalled jobs remain stuck in `active` state permanently, never completing and locking queue slots.

### Test 4.3: Downstream API Outage & Retry-Storm Fuzzer
* **Adversarial Mechanism:** Simulates an external API outage (e.g. Resend or Stripe returning 500s or 429s for 30 seconds). Enqueues 100 failing jobs.
* **Expected Invariant:** Workers must apply exponential backoff with randomized jitter (e.g. retry in 2s, 4s, 8s + jitter) rather than immediate linear retries.
* **Failure Mode Detected:** 100 workers immediately hammering the failing API, triggering hard IP bans and exhausting CPU.

### Test 4.4: Lock Lease Expiry & Concurrent Duplicate Execution
* **Adversarial Mechanism:** Submits a long-running job that takes longer than the queue's default lock lease duration (e.g. a 45-second job with a 30-second lock renewal interval).
* **Expected Invariant:** Worker must automatically renew its lock heartbeat while actively computing. If lock renewal fails, second worker must not execute the exact same state mutation concurrently.
* **Failure Mode Detected:** Two workers processing the exact same video encode or payment job concurrently due to expired lock timeouts.

---

## 3. Dual-Layer Report Schema

```json
{
  "module": "queue",
  "engine": "bullmq",
  "score": "HIGH_RISK",
  "executive_summary": "WORKER CRASH VULNERABILITY: Worker process lacks a top-level try/catch on JSON payload deserialization. Injected poison-pill messages crash the entire worker container.",
  "metrics": {
    "stalled_job_recovery_sec": 32,
    "poison_pill_handled": false,
    "exponential_backoff_verified": false
  },
  "remediation": "Add Zod payload validation inside the worker processor before invoking handler logic, and configure `attempts: 3, backoff: { type: 'exponential', delay: 2000 }`."
}
```
