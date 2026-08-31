import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SandboxServer, TestRunner } from '@acidtest/core';
import { createAiSuite } from '../src/suite.js';

describe('@acidtest/ai', () => {
  let server: SandboxServer;
  let targetUrl: string;

  beforeAll(async () => {
    server = new SandboxServer({ port: 4466, mode: 'hardened' });
    const port = await server.start();
    targetUrl = `http://localhost:${port}/api/chat`;
  });

  afterAll(async () => {
    await server.stop();
  });

  it('executes AI gateway resiliency suite', async () => {
    const suite = createAiSuite('openai');
    const report = await TestRunner.runSuite(suite, { targetUrl });

    expect(report.invariantsTested).toBe(3);
    expect(report.invariantsPassed).toBe(3);
  });
});
