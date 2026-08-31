# 07 — Email & Communication Specification (`@acidtest/email`)

## 1. Scope & Target Providers
This module audits transactional emails, React Email components, template parameter bindings, and delivery failure guards.

* **Target Providers:** Resend, Postmark, SendGrid, Amazon SES, Twilio.
* **Target Templates:** React Email, MJML, Handlebars, raw HTML templates.

---

## 2. Exhaustive Non-Happy-Path Invariant Test Matrix

### Test 7.1: Missing Template Variable & `[object Object]` Leak Fuzzer
* **Adversarial Mechanism:** Invokes email rendering functions with empty objects, `null` properties, or undefined user fields.
* **Expected Invariant:** Templates must provide fallback values (e.g. "Valued Customer" if `firstName` is null) and must never render `undefined`, `null`, or `[object Object]` in customer-facing copy.
* **Failure Mode Detected:** Embarrassing customer emails reading: *"Hi undefined, your payment of [object Object] was processed."*

### Test 7.2: Dead Asset & Broken Link Pre-Flight Scanner
* **Adversarial Mechanism:** Extracts all `<a>` links and `<img>` URLs from the rendered email HTML and executes concurrent HEAD/GET requests.
* **Expected Invariant:** 100% of links, logo images, and action buttons must resolve with `200 OK`.
* **Failure Mode Detected:** Broken logo images (red X) or broken password reset buttons leading to 404 pages.

### Test 7.3: Inbound Email Webhook & Spam Score Pre-Flight
* **Adversarial Mechanism:** Scans email headers and body copy against SpamAssassin rules (e.g. all-caps subject lines, excessive exclamation marks, missing unsubscribe headers).
* **Expected Invariant:** Email score must meet deliverability thresholds with valid `List-Unsubscribe` headers.
* **Failure Mode Detected:** Critical transactional emails (password reset, invoice receipts) landing in customer spam folders.

---

## 3. Dual-Layer Report Schema

```json
{
  "module": "email",
  "provider": "resend",
  "score": "HIGH_RISK",
  "executive_summary": "EMAIL DEFECT: Welcome email template throws unhandled TypeError when `user.company` is null, causing user signup flow to fail.",
  "failing_template": "emails/WelcomeEmail.tsx:L18",
  "remediation": "Add fallback: `const companyName = user.company?.name ?? 'your team';`."
}
```
