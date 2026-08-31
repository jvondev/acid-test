import type { BurstResponse } from './worker.js';

export interface BurstOptions {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  concurrency: number;
  jitterMs?: number;
  timeoutMs?: number;
  useWorkerThreads?: boolean;
}

export interface BurstSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  statusDistribution: Record<number, number>;
  minLatencyMs: number;
  maxLatencyMs: number;
  avgLatencyMs: number;
  responses: BurstResponse[];
  concurrencyWindowMs: number;
}
