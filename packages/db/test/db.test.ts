import { describe, it, expect } from 'vitest';
import { TestRunner } from '@acidtest/core';
import { createDbSuite } from '../src/suite.js';

describe('@acidtest/db', () => {
  it('executes database invariant suite', async () => {
    const suite = createDbSuite('postgresql');
    const report = await TestRunner.runSuite(suite, {});

    expect(report.invariantsTested).toBe(6);
    expect(report.invariantsPassed).toBeGreaterThanOrEqual(5);
  });
});
