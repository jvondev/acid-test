# 08 — Storage & Blob Security Specification (`@acid-test/storage`)

## 1. Scope & Target Providers
This module audits object storage, presigned upload URLs, file validation guards, and bucket permission policies.

* **Target Providers:** AWS S3, Cloudflare R2, Supabase Storage, Google Cloud Storage.
* **Target Interfaces:** Presigned URL generators, upload API routes, media delivery CDN endpoints.

---

## 2. Exhaustive Non-Happy-Path Invariant Test Matrix

### Test 8.1: Presigned URL Overwrite & Key Hijacking Fuzzer
* **Adversarial Mechanism:** Requests a presigned upload URL for `user-uploads/avatar.png`, and attempts to use that presigned URL to upload to `system-assets/logo.png` or another user's directory (`user-uploads/other_user_id/doc.pdf`).
* **Expected Invariant:** Presigned URL must be strictly bound to the exact target key and content-length range.
* **Failure Mode Detected:** Attackers overwriting application assets or other users' private documents using legitimate presigned upload tokens.

### Test 8.2: MIME-Type & Magic Byte Extension Spoofing
* **Adversarial Mechanism:** Uploads an executable script or HTML payload with an image extension (`avatar.png`) and `image/png` header.
* **Expected Invariant:** Backend / Storage workers must verify real magic bytes (e.g. `file-type` header check) and ensure SVG/HTML uploads cannot execute XSS payloads via bucket CDN headers (`Content-Disposition: attachment` or strict `Content-Security-Policy`).
* **Failure Mode Detected:** Stored XSS attacks via uploaded SVGs or malicious executable files stored in public media buckets.

### Test 8.3: Public Read Permission Leak on Private Buckets
* **Adversarial Mechanism:** Attempts unauthenticated `GET` requests to direct S3 / R2 URLs of private documents (e.g. invoices, KYC documents).
* **Expected Invariant:** Direct public URLs must return `403 Forbidden`. Access must require signed temporary URLs or authenticated proxy streams.
* **Failure Mode Detected:** Publicly accessible storage buckets leaking private user documents to search engine crawlers.

---

## 3. Dual-Layer Report Schema

```json
{
  "module": "storage",
  "provider": "s3",
  "score": "CRITICAL",
  "executive_summary": "SECURITY LEAK: S3 bucket `customer-invoices` allows unauthenticated public GET requests. Private financial PDFs are publicly exposed on the web.",
  "remediation": "Enable S3 Block Public Access on the bucket and enforce presigned GET URLs with a 15-minute expiration."
}
```
