# 03 — Auth & Identity Specification (`@acidtest/auth`)

## 1. Scope & Target Providers
This module audits session tokens, JWT claims, cross-organization authorization, and API route security guards.

* **Target Providers:** Clerk, Supabase Auth (GoTrue), NextAuth / Auth.js, Auth0, Kinde, WorkOS.
* **Target Interface:** Application HTTP routes, Next.js Server Actions, REST/GraphQL endpoints.

---

## 2. Exhaustive Non-Happy-Path Invariant Test Matrix

### Test 3.1: Cross-Organization Tenant Hopping Fuzzer
* **Adversarial Mechanism:** Generates a valid, cryptographically signed JWT for User A belonging exclusively to `org_alpha`. Sends requests with this token to mutation endpoints targeting `org_beta` resources (e.g. `POST /api/org/org_beta/members/invite` or Server Action with `{ orgId: 'org_beta' }`).
* **Expected Invariant:** Endpoint must return `403 Forbidden` or `404 Not Found`. Must never execute mutations against unassociated organizations.
* **Failure Mode Detected:** B2B SaaS security flaw where server actions trust client-supplied `orgId` parameters rather than session token claims.

### Test 3.2: Token Replay After Logout / Revocation
* **Adversarial Mechanism:** Captures a valid session token, triggers the logout endpoint, and then immediately replays the old token against protected routes.
* **Expected Invariant:** Token must be rejected with `401 Unauthorized` (via session denylist or short-lived token revocation check).
* **Failure Mode Detected:** Stolen session tokens remaining valid for days/weeks after a user clicks "Log Out".

### Test 3.3: JWT Algorithm Confusion & `alg: none` Attack
* **Adversarial Mechanism:** Strips the signature from a valid JWT, sets the header to `{"alg": "none"}`, changes the `user_id` to an admin account, and sends it to the API.
* **Expected Invariant:** Immediate `401 Unauthorized`. Backend must enforce explicit algorithm whitelisting (`RS256` / `EdDSA`).
* **Failure Mode Detected:** Unauthenticated admin takeover due to insecure JWT verification libraries.

### Test 3.4: Mass Assignment Role Escalation Fuzzer
* **Adversarial Mechanism:** Sends profile update requests (`PATCH /api/user/profile` or Server Action) containing hidden administrative payload fields:
  ```json
  { "name": "John", "role": "admin", "is_superadmin": true, "credits": 999999 }
  ```
* **Expected Invariant:** Endpoint must strip or ignore unwhitelisted fields; database role must remain unchanged.
* **Failure Mode Detected:** Privilege escalation allowing regular users to grant themselves administrative permissions.

### Test 3.5: Concurrent Double-Refresh Token Race Condition
* **Adversarial Mechanism:** Sends the exact same refresh token twice simultaneously within 10ms to the token refresh endpoint.
* **Expected Invariant:** Exactly one new access/refresh pair issued; second request fails or triggers automatic reuse detection (invalidating the entire token family if compromised).
* **Failure Mode Detected:** Session cloning where attackers duplicate active refresh tokens.

---

## 3. Dual-Layer Report Schema

```json
{
  "module": "auth",
  "provider": "clerk",
  "score": "HIGH_RISK",
  "executive_summary": "SECURITY DEFECT: Server actions trust client-provided `orgId` without verifying session membership, allowing users from Company A to invite members to Company B.",
  "failing_endpoints": [
    "app/actions/members.ts:L42"
  ],
  "remediation": "Replace `const { orgId } = input` with `const { orgId } = await auth()` from the Clerk server SDK."
}
```
