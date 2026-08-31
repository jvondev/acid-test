import type { InvariantSuite, InvariantTest } from '@acidtest/core';
import { PresignedUrlHijackingTest } from './invariants/8.1-presigned-url-hijacking.js';
import { MagicByteSpoofingTest } from './invariants/8.2-magic-byte-spoofing.js';
import { PublicReadLeakTest } from './invariants/8.3-public-read-leak.js';

export function createStorageSuite(provider: string = 's3'): InvariantSuite {
  const tests: InvariantTest[] = [
    new PresignedUrlHijackingTest(),
    new MagicByteSpoofingTest(),
    new PublicReadLeakTest(),
  ];

  return {
    name: 'Storage & Blob Security Invariant Suite',
    category: 'storage',
    provider,
    tests,
  };
}
