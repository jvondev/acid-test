# 05 — Webhook Ingress & Cryptographic Specification (`@acid-test/webhook`)

## 1. Scope & Target Providers
This module audits webhook ingress gateways, HMAC signature verification pipelines, and raw-buffer handling.

* **Target Providers:** GitHub, Shopify, Slack, Svix, Stripe, Resend, Discord, DocuSign.
* **Target Interface:** Ingress HTTP routes (e.g. `/api/webhooks/*`).

---

## 2. Exhaustive Non-Happy-Path Invariant Test Matrix

### Test 5.1: Raw Byte-Buffer vs. Mutated JSON Body Parser Check
* **Adversarial Mechanism:** Sends a validly signed webhook payload containing un-normalized JSON whitespace (e.g. `{"key":   "value" \n}`).
* **Expected Invariant:** The backend must compute HMAC over the raw, untouched request byte stream (`req.rawBody` or `req.text()`), NOT on a re-stringified JSON object (`JSON.stringify(req.body)`).
* **Failure Mode Detected:** Webhook signature verification randomly failing in production due to middleware formatting discrepancies.

### Test 5.2: Timestamp Tolerance Window & Replay Attack Fuzzer
* **Adversarial Mechanism:** Captures a validly signed webhook from 10 minutes ago and replays it against the webhook endpoint.
* **Expected Invariant:** Backend must verify the timestamp header (`Stripe-Signature: t=...` or `X-Slack-Request-Timestamp: ...`) and reject requests older than the tolerance window (typically 300 seconds) with `400 Bad Request`.
* **Failure Mode Detected:** Attackers replaying captured payment or user creation events to trigger unauthorized actions.

### Test 5.3: Timing-Attack Vulnerability Check on Signature Comparison
* **Adversarial Mechanism:** Analyzes backend source or conducts high-precision latency measurements on forged signatures that match the first $N$ characters of the valid signature vs 0 matching characters.
* **Expected Invariant:** Backend must use constant-time comparison (`crypto.timingSafeEqual`), NOT standard equality operators (`===` or `==`).
* **Failure Mode Detected:** Side-channel timing attacks allowing malicious actors to brute-force cryptographic signatures byte-by-byte.

### Test 5.4: Webhook Ingress Slowloris & Timeout Resilience
* **Adversarial Mechanism:** Connects to the webhook route, sends headers, and transmits the JSON payload byte-by-byte over 12 seconds.
* **Expected Invariant:** Backend must enforce strict request read timeouts or process ingress asynchronously without blocking the server event loop.
* **Failure Mode Detected:** A single slow webhook connection exhausting Node.js HTTP worker sockets and causing downtime.

---

## 3. Dual-Layer Report Schema

```json
{
  "module": "webhook",
  "provider": "shopify",
  "score": "CRITICAL",
  "executive_summary": "SECURITY FLAW: Webhook handler uses standard string equality (`===`) instead of `crypto.timingSafeEqual` and lacks timestamp tolerance checks, exposing the endpoint to replay attacks.",
  "remediation": "Import `crypto` and compare signatures using `crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(computedSig))`."
}
```
