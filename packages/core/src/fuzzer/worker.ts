import { parentPort, workerData } from 'node:worker_threads';
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

interface WorkerPayload {
  __isAcidTestWorker?: boolean;
  __isAcidtestWorker?: boolean;
  workerId: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  jitterMs: number;
  timeoutMs: number;
  sharedBuffer?: SharedArrayBuffer;
}

export interface BurstResponse {
  workerId: number;
  statusCode: number;
  statusText: string;
  headers: Record<string, string | string[] | undefined>;
  body: string;
  latencyMs: number;
  timestamp: number;
  error?: string;
}

async function runWorker() {
  const data: WorkerPayload = workerData;
  const { workerId, url, method, headers, body, jitterMs, timeoutMs, sharedBuffer } = data;

  if (sharedBuffer) {
    const int32View = new Int32Array(sharedBuffer);
    Atomics.wait(int32View, 0, 0);
  }

  if (jitterMs > 0) {
    const delay = Math.random() * jitterMs;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  const parsedUrl = new URL(url);
  const isHttps = parsedUrl.protocol === 'https:';
  const client = isHttps ? https : http;

  const reqHeaders: Record<string, string> = { ...headers };
  if (body && !reqHeaders['content-length'] && !reqHeaders['Content-Length']) {
    reqHeaders['Content-Length'] = Buffer.byteLength(body).toString();
  }

  const startTime = process.hrtime.bigint();
  const startTimestamp = Date.now();

  const reqOptions: http.RequestOptions = {
    protocol: parsedUrl.protocol,
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (isHttps ? 443 : 80),
    path: `${parsedUrl.pathname}${parsedUrl.search}`,
    method: method || 'POST',
    headers: reqHeaders,
    timeout: timeoutMs || 10000,
    agent: isHttps
      ? new https.Agent({ keepAlive: true, maxSockets: 100 })
      : new http.Agent({ keepAlive: true, maxSockets: 100 }),
  };

  const promise = new Promise<BurstResponse>((resolve) => {
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
  });

  const result = await promise;
  parentPort?.postMessage(result);
}

if (parentPort && (workerData?.__isAcidTestWorker === true || workerData?.__isAcidtestWorker === true)) {
  runWorker().catch((err) => {
    parentPort?.postMessage({
      workerId: workerData?.workerId ?? -1,
      statusCode: 0,
      statusText: 'WORKER_FATAL',
      headers: {},
      body: '',
      latencyMs: 0,
      timestamp: Date.now(),
      error: err instanceof Error ? err.message : String(err),
    });
  });
}
