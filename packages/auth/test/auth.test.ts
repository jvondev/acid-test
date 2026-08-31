import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SandboxServer, TestRunner } from '@acidtest/core';
import { createAuthSuite } from '../src/suite.js';

describe('@acidtest/auth', () => {
  let server: SandboxServer;
  let targetUrl: string;

  beforeAll(async () => {
    server = new SandboxServer({ port: 4462, mode: 'hardened' });
    const port = await server.start();
    targetUrl = `http://localhost:${port}/api/auth`;
  });

  afterAll(async () => {
    await server.stop();
  });

  it('executes auth suite against hardened target', async () => {
    const suite = createAuthSuite('clerk');
    const report = await TestRunner.runSuite(suite, { targetUrl });

    expect(report.invariantsTested).toBe(5);
    expect(report.invariantsPassed).toBe(5);
  });
});
