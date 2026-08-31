import { Worker } from 'node:worker_threads';
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import path from 'node:path';
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

export class MicrosecondBurstDispatcher {
  /**
   * Dispatches N concurrent requests against a target URL with microsecond/millisecond jitter
   */
  static async dispatch(options: BurstOptions): Promise<BurstSummary> {
    const {
      url,
      method = 'POST',
      headers = {},
      body = '',
      concurrency = 10,
      jitterMs = 5,
      timeoutMs = 10000,
      useWorkerThreads = false,
    } = options;

    if (useWorkerThreads) {
      try {
        return await this.dispatchWithWorkerThreads({
          url,
          method,
          headers,
          body,
          concurrency,
          jitterMs,
          timeoutMs,
        });
      } catch {
        // Fallback to high-performance async socket dispatcher
      }
    }

    return this.dispatchAsyncSockets({
      url,
      method,
      headers,
      body,
      concurrency,
      jitterMs,
      timeoutMs,
    });
  }

  /**
   * High-performance in-process async socket dispatcher with microsecond timing
   */
  private static async dispatchAsyncSockets(
    options: Omit<BurstOptions, 'useWorkerThreads'>
  ): Promise<BurstSummary> {
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
              const respBody = Buffer.concat(chunks).toString('utf8');

              resolve({
                workerId,
                statusCode: res.statusCode || 0,
                statusText: res.statusMessage || '',
                headers: res.headers as Record<string, string | string[] | undefined>,
                body: respBody,
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

          req.on('timeout', () => {
            req.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
          });

          if (body) {
            req.write(body);
          }
          req.end();
        }, jitterDelay);
      });

      promises.push(p);
    }

    const responses = await Promise.all(promises);
    const overallDuration = Date.now() - overallStartTime;

    return this.calculateSummary(responses, overallDuration);
  }

  /**
   * Thread-level barrier synchronized burst using SharedArrayBuffer & Atomics
   */
  private static async dispatchWithWorkerThreads(
    options: Omit<BurstOptions, 'useWorkerThreads'>
  ): Promise<BurstSummary> {
    const { url, method = 'POST', headers = {}, body = '', concurrency, jitterMs = 0, timeoutMs = 10000 } = options;

    const sharedBuffer = new SharedArrayBuffer(4);
    const int32View = new Int32Array(sharedBuffer);
    int32View[0] = 0;

    const workerFile = path.resolve(__dirname, 'worker.js');
    const workers: Worker[] = [];
    const workerPromises: Promise<BurstResponse>[] = [];

    const overallStartTime = Date.now();

    for (let i = 0; i < concurrency; i++) {
      const workerPromise = new Promise<BurstResponse>((resolve, reject) => {
        const worker = new Worker(workerFile, {
          workerData: {
            __isAcidtestWorker: true,
            workerId: i + 1,
            url,
            method,
            headers,
            body,
            jitterMs,
            timeoutMs,
            sharedBuffer,
          },
        });

        worker.on('message', (res: BurstResponse) => {
          resolve(res);
        });

        worker.on('error', (err) => {
          reject(err);
        });

        worker.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`Worker exited with code ${code}`));
          }
        });

        workers.push(worker);
      });

      workerPromises.push(workerPromise);
    }

    await new Promise((r) => setTimeout(r, 20));

    Atomics.store(int32View, 0, 1);
    Atomics.notify(int32View, 0, concurrency);

    const responses = await Promise.all(workerPromises);
    const overallDuration = Date.now() - overallStartTime;

    return this.calculateSummary(responses, overallDuration);
  }

  private static calculateSummary(responses: BurstResponse[], durationMs: number): BurstSummary {
    const statusDistribution: Record<number, number> = {};
    let successfulRequests = 0;
    let failedRequests = 0;
    let totalLatency = 0;
    let minLatencyMs = Number.MAX_VALUE;
    let maxLatencyMs = 0;

    for (const res of responses) {
      statusDistribution[res.statusCode] = (statusDistribution[res.statusCode] || 0) + 1;

      if (res.statusCode >= 200 && res.statusCode < 300) {
        successfulRequests++;
      } else {
        failedRequests++;
      }

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
