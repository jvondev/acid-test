import { describe, it, expect } from 'vitest';
import { TestRunner } from '@acid-test/core';
import { createStorageSuite } from '../src/suite.js';

describe('@acid-test/storage', () => {
  it('executes storage security suite', async () => {
    const suite = createStorageSuite('s3');
    const report = await TestRunner.runSuite(suite, {});

    expect(report.invariantsTested).toBe(3);
    expect(report.invariantsPassed).toBe(3);
  });
});
