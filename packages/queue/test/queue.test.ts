import { describe, it, expect } from 'vitest';
import { TestRunner } from '@acidtest/core';
import { createQueueSuite } from '../src/suite.js';

describe('@acidtest/queue', () => {
  it('executes queue chaos suite', async () => {
    const suite = createQueueSuite('bullmq');
    const report = await TestRunner.runSuite(suite, {});

    expect(report.invariantsTested).toBe(4);
    expect(report.invariantsPassed).toBe(4);
  });
});
