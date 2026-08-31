# 01 — Billing & Financial Invariant Specification (`@acid-test/billing`)

## 1. Scope & Target Providers
This module stress-tests payment, checkout, and subscription workflows against financial race conditions, non-idempotent handlers, and ledger state drift.

* **Primary Providers:** Stripe, LemonSqueezy, Paddle, Shopify, Braintree.
* **Target Interface:** Localhost or staging webhook endpoints (e.g. `http://localhost:3000/api/webhooks/stripe`) + optional database ledger connection.

---

## 2. Exhaustive Non-Happy-Path Invariant Test Matrix

### Test 1.1: Concurrent Webhook Burst (Idempotency & Isolation Fuzzer)
* **Adversarial Mechanism:** Sends the exact same `payment_intent.succeeded` or `checkout.session.completed` event $N=10$ times concurrently using worker threads with microsecond jitter (0ms to 25ms delay).
* **Expected Invariant:** The target backend must execute the business logic (crediting account, provisioning license, updating status) exactly ONCE. The other 9 requests must return HTTP 200/202 with zero side-effects.
* **Failure Mode Detected:** Double-crediting user balance, creating duplicate subscription rows in DB, sending 10 duplicate receipt emails.

### Test 1.2: Mutated Payload with Same Idempotency Key (Tamper Fuzzer)
* **Adversarial Mechanism:** Sends a valid webhook payload, then immediately sends a second payload with the same event ID (`evt_...`) but with mutated data (e.g. changed `customer_id` or changed `amount_total: 99900`).
* **Expected Invariant:** The backend must detect the duplicate ID and reject or ignore the payload without executing the mutated values.
* **Failure Mode Detected:** State corruption or privilege escalation via forged event re-use.

### Test 1.3: Dunning Cycle Time-Travel Simulation (Lifecycle Fuzzer)
* **Adversarial Mechanism:** Generates a synthetic 90-day subscription lifecycle with valid HMAC signatures, firing events in rapid sequence:
  1. `customer.subscription.created` (Status: `trialing`)
  2. `invoice.payment_failed` (Status: `past_due`, Attempt 1)
  3. `invoice.payment_failed` (Status: `past_due`, Attempt 2)
  4. `customer.subscription.updated` (Customer updates card, status `active`)
  5. `invoice.payment_succeeded`
* **Expected Invariant:** Database status transitions must match each step sequentially without locking up or skipping states.
* **Failure Mode Detected:** User access remains revoked after successful payment recovery, or past-due dunning banner never clears.

### Test 1.4: Concurrent Upgrade & Cancel Race Condition
* **Adversarial Mechanism:** Fires a `customer.subscription.updated` (upgrade to Enterprise) and `customer.subscription.deleted` (cancel) simultaneously with a 2ms gap.
* **Expected Invariant:** Final database state must match the definitive timestamp of the provider, not the order of arrival.
* **Failure Mode Detected:** Canceled user remains on active Enterprise plan in local DB.

### Test 1.5: Currency Fraction & Rounding Mismatch (Ceiling Drift)
* **Adversarial Mechanism:** Tests usage-based event calculations with 3-decimal currencies (e.g. JPY, KWD, fractional cents in USD like $0.0035/token).
* **Expected Invariant:** Local rounding (`Math.floor` vs `Math.ceil` vs `Math.round`) must match provider integer subunit specifications (cents).
* **Failure Mode Detected:** Database records a revenue discrepancy of $\pm$0.01 per transaction, compounding to thousands in accounting errors.

### Test 1.6: Split-Second Double Checkout Session Completion
* **Adversarial Mechanism:** Simulates a user rapidly clicking "Pay Now" twice or double-webhook dispatch from payment gateway.
* **Expected Invariant:** Database unique constraints (`transaction_id` or `stripe_payment_intent_id`) or Redis distributed locks must block the second insertion cleanly.
* **Failure Mode Detected:** Duplicate order rows created with different internal primary keys.

### Test 1.7: Database vs. Stripe Ledger Reconciliation Diff
* **Adversarial Mechanism:** Queries the target database's `subscriptions` table and compares every active user against the live Stripe API via secret key.
* **Expected Invariant:** 0% drift between local DB subscription status and Stripe cloud status.
* **Failure Mode Detected:** Ghost subscriptions (users receiving free service after Stripe canceled due to fraud) or zombie billings.

---

## 3. Dual-Layer Report Schema

```json
{
  "module": "billing",
  "provider": "stripe",
  "score": "FAIL",
  "financial_risk_usd_monthly": 4500,
  "executive_summary": "Your Stripe webhook handler is vulnerable to race conditions. When duplicate payment webhooks arrive within 15ms, the backend provisions 2 active subscriptions for 1 user.",
  "invariants_tested": 7,
  "invariants_passed": 5,
  "invariants_failed": 2,
  "reproduction": {
    "curl_burst": "curl -X POST http://localhost:3000/api/webhooks/stripe -H 'Stripe-Signature: ...' ... (x10 concurrent)",
    "failing_file": "app/api/webhooks/stripe/route.ts",
    "suggested_fix": "Wrap subscription provisioning in a PostgreSQL SERIALIZABLE transaction or use a Redis distributed lock on `event.data.object.customer`."
  }
}
```
