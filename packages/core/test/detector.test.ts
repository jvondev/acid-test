import { describe, it, expect } from 'vitest';
import { ProjectDetector } from '../src/discovery/detector.js';
import path from 'node:path';

describe('ProjectDetector Auto-Discovery Engine', () => {
  it('discovers project metadata and active services from root', async () => {
    const discovery = await ProjectDetector.discover(process.cwd());

    expect(discovery).toBeDefined();
    expect(discovery.projectRoot).toBe(path.resolve(process.cwd()));
    expect(discovery.projectName).toBeDefined();
    expect(Array.isArray(discovery.detectedServices)).toBe(true);
    expect(Array.isArray(discovery.activeDomains)).toBe(true);
    expect(Array.isArray(discovery.skippedDomains)).toBe(true);
  });

  it('correctly maps unconfigured domains to skippedDomains', async () => {
    const discovery = await ProjectDetector.discover(process.cwd());
    const totalKnownDomains = 8;
    expect(discovery.activeDomains.length + discovery.skippedDomains.length).toBe(totalKnownDomains);
  });
});
