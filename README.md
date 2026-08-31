# acidtest

> The definitive ACID reliability & resilience audit suite for backend systems, databases, and billing.

```bash
npx acidtest --help
```

## Overview
`acidtest` is an automated reliability and chaos-testing suite designed to audit backend architectures against the core invariants of **Atomicity**, **Consistency**, **Isolation**, and **Durability**.

- **Billing & Webhook Fuzzer:** Detect race conditions and verify idempotent state transitions.
- **Database & RLS Auditor:** Mathematically verify multi-tenant isolation and detect data leaks.
- **Queue Chaos Runner:** Benchmark worker resilience against poison-pills and retry storms.

## License
MIT © jvondev
