import type { BurstOptions, BurstSummary } from './types.js';
import { SocketDispatcher } from './socket-dispatcher.js';
import { ThreadDispatcher } from './thread-dispatcher.js';

export * from './types.js';

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
        return await ThreadDispatcher.dispatch({
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

    return SocketDispatcher.dispatch({
      url,
      method,
      headers,
      body,
      concurrency,
      jitterMs,
      timeoutMs,
    });
  }
}
