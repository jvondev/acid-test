import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SandboxServer, TestRunner } from '@acidtest/core';
import { createBillingSuite } from '../src/suite.js';

describe('@acidtest/billing', () => {
  let server: SandboxServer;
  let targetUrl: string;

  beforeAll(async () => {
    server = new SandboxServer({ port: 4460, mode: 'hardened' });
    const port = await server.start();
    targetUrl = `http://localhost:${port}/api/billing`;
  });

  afterAll(async () => {
    await server.stop();
  });

  it('executes complete 7-invariant billing suite with 100% pass on hardened target', async () => {
    const suite = createBillingSuite('stripe');
    const report = await TestRunner.runSuite(suite, {
      targetUrl,
      concurrency: 10,
      jitterMs: 5,
    });

    expect(report.invariantsTested).toBe(7);
    expect(report.invariantsPassed).toBe(7);
    expect(report.invariantsFailed).toBe(0);
    expect(report.healthGrade).toBe('A');
    expect(report.totalRiskUsd).toBe(0);
  });
});
