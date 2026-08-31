import { describe, it, expect } from 'vitest';
import { TestRunner } from '@acidtest/core';
import { createEmailSuite } from '../src/suite.js';

describe('@acidtest/email', () => {
  it('executes email communication suite', async () => {
    const suite = createEmailSuite('resend');
    const report = await TestRunner.runSuite(suite, {});

    expect(report.invariantsTested).toBe(3);
    expect(report.invariantsPassed).toBe(3);
  });
});
