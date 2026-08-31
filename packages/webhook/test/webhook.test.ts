import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SandboxServer, TestRunner } from '@acidtest/core';
import { createWebhookSuite } from '../src/suite.js';

describe('@acidtest/webhook', () => {
  let server: SandboxServer;
  let targetUrl: string;

  beforeAll(async () => {
    server = new SandboxServer({ port: 4464, mode: 'hardened' });
    const port = await server.start();
    targetUrl = `http://localhost:${port}/api/webhooks/shopify`;
  });

  afterAll(async () => {
    await server.stop();
  });

  it('executes webhook ingress security suite', async () => {
    const suite = createWebhookSuite('shopify');
    const report = await TestRunner.runSuite(suite, { targetUrl });

    expect(report.invariantsTested).toBe(4);
    expect(report.invariantsPassed).toBe(4);
  });
});
