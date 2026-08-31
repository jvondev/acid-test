import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { MicrosecondBurstDispatcher } from '../src/fuzzer/burst.js';

describe('MicrosecondBurstDispatcher', () => {
  let server: http.Server;
  let serverUrl: string;
  let requestCount = 0;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      requestCount++;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ count: requestCount }));
    });

    await new Promise<void>((resolve) => {
      server.listen(0, 'localhost', () => {
        const addr = server.address() as { port: number };
        serverUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('dispatches 10 concurrent requests within tight jitter window', async () => {
    requestCount = 0;
    const summary = await MicrosecondBurstDispatcher.dispatch({
      url: serverUrl,
      concurrency: 10,
      jitterMs: 5,
    });

    expect(summary.totalRequests).toBe(10);
    expect(summary.successfulRequests).toBe(10);
    expect(summary.failedRequests).toBe(0);
    expect(summary.statusDistribution[200]).toBe(10);
    expect(requestCount).toBe(10);
    expect(summary.avgLatencyMs).toBeGreaterThan(0);
  });
});
