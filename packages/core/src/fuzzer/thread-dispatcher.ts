import { Worker } from 'node:worker_threads';
import path from 'node:path';
import type { BurstOptions, BurstSummary } from './types.js';
import type { BurstResponse } from './worker.js';
import { SocketDispatcher } from './socket-dispatcher.js';

export class ThreadDispatcher {
  static async dispatch(options: Omit<BurstOptions, 'useWorkerThreads'>): Promise<BurstSummary> {
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

        worker.on('message', (res: BurstResponse) => resolve(res));
        worker.on('error', (err) => reject(err));
        worker.on('exit', (code) => {
          if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
        });

        workers.push(worker);
      });

      workerPromises.push(workerPromise);
    }

    await new Promise((r) => setTimeout(r, 20));
    Atomics.store(int32View, 0, 1);
    Atomics.notify(int32View, 0, concurrency);

    const responses = await Promise.all(workerPromises);
    return SocketDispatcher.calculateSummary(responses, Date.now() - overallStartTime);
  }
}
