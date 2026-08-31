# 06 — AI Gateway & Streaming Specification (`@acidtest/ai`)

## 1. Scope & Target Providers
This module audits AI chat endpoints, streaming Server-Sent Events (SSE), structured output parsers, and token rate-limiting gateways.

* **Target Providers:** OpenAI, Anthropic (Claude), Google Gemini, DeepSeek, Local Ollama / vLLM.
* **Target Interface:** Application AI routes (e.g. `/api/chat`, `/api/generate`, Next.js AI SDK endpoints).

---

## 2. Exhaustive Non-Happy-Path Invariant Test Matrix

### Test 6.1: Streaming SSE Disconnect & Memory Leak Fuzzer
* **Adversarial Mechanism:** Initiates a streaming SSE chat completion, abruptly aborts the client connection after receiving 3 token chunks, and monitors server memory and active upstream LLM connections.
* **Expected Invariant:** The backend must attach an `AbortSignal` to the upstream OpenAI/Anthropic SDK call and terminate the upstream stream immediately upon client disconnect.
* **Failure Mode Detected:** Server continues streaming tokens from OpenAI in the background for 30 seconds after the user closes the tab, wasting thousands of dollars in unused token fees and leaking memory.

### Test 6.2: Structured Output Schema Poisoning & Malformed JSON Fuzzer
* **Adversarial Mechanism:** Simulates upstream LLM responses with:
  1. JSON wrapped in markdown blocks (````json { ... } ````)
  2. Trailing commas or missing closing brackets
  3. Numbers returned as strings (`"count": "15"`)
  4. Extra unwhitelisted hallucinated fields
* **Expected Invariant:** Backend schema parsers (Zod / TypeBox) must handle partial formatting cleanly with fallback parsing without throwing unhandled 500 server crashes.
* **Failure Mode Detected:** User-facing frontend crashes on slightly malformed LLM outputs.

### Test 6.3: Simulated 429 Rate-Limit & Backpressure Cascade
* **Adversarial Mechanism:** Intercepts upstream AI calls and simulates a `429 Too Many Requests` (with `Retry-After: 5`) from OpenAI.
* **Expected Invariant:** Application must return a clean, friendly rate-limit error or queue the request gracefully. Must never crash or expose raw API error dumps with secret keys to the client.
* **Failure Mode Detected:** Sensitive API key or organization ID leaked inside raw OpenAI error responses to end users.

---

## 3. Dual-Layer Report Schema

```json
{
  "module": "ai",
  "provider": "openai",
  "score": "HIGH_RISK",
  "executive_summary": "TOKEN LEAK DEFECT: Upstream OpenAI streams are not linked to the client's `AbortSignal`. Aborted client requests continue burning tokens in the background.",
  "remediation": "Pass `signal: req.signal` to `openai.chat.completions.create({ ... })`."
}
```
