import type { InvariantSuite, InvariantTest } from '@acidtest/core';
import { StreamingSseDisconnectTest } from './invariants/6.1-streaming-sse-disconnect.js';
import { StructuredOutputPoisoningTest } from './invariants/6.2-structured-output-poisoning.js';
import { Simulated429BackpressureTest } from './invariants/6.3-simulated-429-backpressure.js';

export function createAiSuite(provider: string = 'openai'): InvariantSuite {
  const tests: InvariantTest[] = [
    new StreamingSseDisconnectTest(),
    new StructuredOutputPoisoningTest(),
    new Simulated429BackpressureTest(),
  ];

  return {
    name: 'AI Gateway & Streaming Resiliency Suite',
    category: 'ai',
    provider,
    tests,
  };
}
