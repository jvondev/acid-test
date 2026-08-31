import { describe, it, expect } from 'vitest';
import { MultiProviderHmacEngine } from '../src/crypto/hmac.js';

describe('MultiProviderHmacEngine', () => {
  const secret = 'test_secret_key_12345';
  const payload = '{"event":"charge.succeeded","amount":1000}';

  it('generates valid Stripe signature with timestamp and v1 hex', () => {
    const sig = MultiProviderHmacEngine.sign({
      provider: 'stripe',
      secret,
      payload,
      timestamp: 1700000000,
    });

    expect(sig.headerName).toBe('stripe-signature');
    expect(sig.headerValue).toMatch(/^t=1700000000,v1=[a-f0-9]{64}$/);
    expect(sig.timestamp).toBe(1700000000);
  });

  it('generates valid Shopify base64 signature', () => {
    const sig = MultiProviderHmacEngine.sign({
      provider: 'shopify',
      secret,
      payload,
    });

    expect(sig.headerName).toBe('x-shopify-hmac-sha256');
    expect(sig.headerValue).toBeTruthy();
    expect(Buffer.from(sig.headerValue, 'base64').toString('base64')).toBe(sig.headerValue);
  });

  it('generates valid Slack v0 signature with timestamp prefix', () => {
    const sig = MultiProviderHmacEngine.sign({
      provider: 'slack',
      secret,
      payload,
      timestamp: 1700000000,
    });

    expect(sig.headerName).toBe('x-slack-signature');
    expect(sig.headerValue).toMatch(/^v0=[a-f0-9]{64}$/);
  });

  it('generates valid GitHub sha256 signature', () => {
    const sig = MultiProviderHmacEngine.sign({
      provider: 'github',
      secret,
      payload,
    });

    expect(sig.headerName).toBe('x-hub-signature-256');
    expect(sig.headerValue).toMatch(/^sha256=[a-f0-9]{64}$/);
  });

  it('performs constant-time safe comparison', () => {
    const sigA = '67bbe2b654f05a1b3b27fef3a3e86a9e12640eb3c96e0f434c9c30d12a8084f6';
    const sigB = '67bbe2b654f05a1b3b27fef3a3e86a9e12640eb3c96e0f434c9c30d12a8084f6';
    const sigC = '0000000000000000000000000000000000000000000000000000000000000000';

    expect(MultiProviderHmacEngine.safeCompare(sigA, sigB)).toBe(true);
    expect(MultiProviderHmacEngine.safeCompare(sigA, sigC)).toBe(false);
    expect(MultiProviderHmacEngine.safeCompare(sigA, 'short')).toBe(false);
  });
});
