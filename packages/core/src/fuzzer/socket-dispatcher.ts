import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import type { BurstOptions, BurstSummary } from './types.js';
import type { BurstResponse } from './worker.js';

export class SocketDispatcher {
  static async dispatch(options: Omit<BurstOptions, 'useWorkerThreads'>): Promise<BurstSummary> {
    const { url, method = 'POST', headers = {}, body = '', concurrency, jitterMs = 0, timeoutMs = 10000 } = options;

    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const agent = isHttps
      ? new https.Agent({ keepAlive: true, maxSockets: concurrency * 2 })
      : new http.Agent({ keepAlive: true, maxSockets: concurrency * 2 });

    const reqHeaders: Record<string, string> = { ...headers };
    if (body && !reqHeaders['content-length'] && !reqHeaders['Content-Length']) {
      reqHeaders['Content-Length'] = Buffer.byteLength(body).toString();
    }

    const promises: Promise<BurstResponse>[] = [];
    const overallStartTime = Date.now();

    for (let i = 0; i < concurrency; i++) {
      const workerId = i + 1;
      const jitterDelay = jitterMs > 0 ? Math.random() * jitterMs : 0;

      const p = new Promise<BurstResponse>((resolve) => {
        setTimeout(() => {
          const reqOptions: http.RequestOptions = {
            protocol: parsedUrl.protocol,
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: `${parsedUrl.pathname}${parsedUrl.search}`,
            method,
            headers: reqHeaders,
            timeout: timeoutMs,
            agent,
          };

          const startTime = process.hrtime.bigint();
          const startTimestamp = Date.now();

          const req = client.request(reqOptions, (res) => {
            const chunks: Buffer[] = [];
            res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
            res.on('end', () => {
              const endTime = process.hrtime.bigint();
              const latencyMs = Number(endTime - startTime) / 1_000_000;
              resolve({
                workerId,
                statusCode: res.statusCode || 0,
                statusText: res.statusMessage || '',
                headers: res.headers as Record<string, string | string[] | undefined>,
                body: Buffer.concat(chunks).toString('utf8'),
                latencyMs,
                timestamp: startTimestamp,
              });
            });
          });

          req.on('error', (err) => {
            const endTime = process.hrtime.bigint();
            const latencyMs = Number(endTime - startTime) / 1_000_000;
            resolve({
              workerId,
              statusCode: 0,
              statusText: 'CLIENT_ERROR',
              headers: {},
              body: '',
              latencyMs,
              timestamp: startTimestamp,
              error: err.message,
            });
          });

          req.on('timeout', () => req.destroy(new Error(`Request timed out after ${timeoutMs}ms`)));

          if (body) req.write(body);
          req.end();
        }, jitterDelay);
      });

      promises.push(p);
    }

    const responses = await Promise.all(promises);
    return this.calculateSummary(responses, Date.now() - overallStartTime);
  }

  static calculateSummary(responses: BurstResponse[], durationMs: number): BurstSummary {
    const statusDistribution: Record<number, number> = {};
    let successfulRequests = 0;
    let failedRequests = 0;
    let totalLatency = 0;
    let minLatencyMs = Number.MAX_VALUE;
    let maxLatencyMs = 0;

    for (const res of responses) {
      statusDistribution[res.statusCode] = (statusDistribution[res.statusCode] || 0) + 1;
      if (res.statusCode >= 200 && res.statusCode < 300) successfulRequests++;
      else failedRequests++;

      totalLatency += res.latencyMs;
      if (res.latencyMs < minLatencyMs) minLatencyMs = res.latencyMs;
      if (res.latencyMs > maxLatencyMs) maxLatencyMs = res.latencyMs;
    }

    if (minLatencyMs === Number.MAX_VALUE) minLatencyMs = 0;
    const avgLatencyMs = responses.length > 0 ? totalLatency / responses.length : 0;

    return {
      totalRequests: responses.length,
      successfulRequests,
      failedRequests,
      statusDistribution,
      minLatencyMs: Math.round(minLatencyMs * 100) / 100,
      maxLatencyMs: Math.round(maxLatencyMs * 100) / 100,
      avgLatencyMs: Math.round(avgLatencyMs * 100) / 100,
      responses,
      concurrencyWindowMs: durationMs,
    };
  }
}
