import http from 'node:http';
import { SandboxRouteHandlers } from './routes.js';

export interface SandboxServerOptions {
  port?: number;
  mode?: 'vulnerable' | 'hardened';
}

export class SandboxServer {
  private server?: http.Server;
  private port: number;
  private mode: 'vulnerable' | 'hardened';

  public subscriptions: Map<string, { customerId: string; status: string; credits: number }> = new Map();
  public processedEventIds: Set<string> = new Set();
  public activeStreamsCount = 0;
  public deadLetterQueue: unknown[] = [];

  constructor(options: SandboxServerOptions = {}) {
    this.port = options.port || 4455;
    this.mode = options.mode || 'vulnerable';
  }

  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        const url = new URL(req.url || '/', `http://localhost:${this.port}`);
        const path = url.pathname;

        if (path === '/health' || path === '/') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', mode: this.mode, time: Date.now() }));
          return;
        }

        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        const bodyStr = Buffer.concat(chunks).toString('utf8');

        if (path.startsWith('/api/webhooks/stripe') || path.startsWith('/api/billing')) {
          SandboxRouteHandlers.handleBilling(req, res, bodyStr, this.mode, {
            subscriptions: this.subscriptions,
            processedEventIds: this.processedEventIds,
          });
          return;
        }

        if (path.startsWith('/api/webhooks/shopify') || path.startsWith('/api/webhooks/raw') || path.startsWith('/api/webhooks')) {
          SandboxRouteHandlers.handleWebhook(req, res, this.mode);
          return;
        }

        if (path.startsWith('/api/org') || path.startsWith('/api/auth') || path.startsWith('/api/user') || path.startsWith('/api/admin')) {
          SandboxRouteHandlers.handleAuth(path, (req.headers['authorization'] as string) || '', bodyStr, this.mode, res);
          return;
        }

        if (path.startsWith('/api/jobs')) {
          if (this.mode === 'vulnerable') {
            try {
              JSON.parse(bodyStr);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ enqueued: true }));
            } catch {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Worker crash' }));
            }
          } else {
            try { JSON.parse(bodyStr); } catch { this.deadLetterQueue.push(bodyStr); }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ enqueued: true, routedToDlq: this.deadLetterQueue.length > 0 }));
          }
          return;
        }

        if (path.startsWith('/api/chat') || path.startsWith('/api/ai/stream')) {
          res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
          this.activeStreamsCount++;
          let chunkIndex = 0;
          const interval = setInterval(() => {
            chunkIndex++;
            res.write(`data: ${JSON.stringify({ token: `token_${chunkIndex}` })}\n\n`);
            if (chunkIndex >= 10) {
              clearInterval(interval);
              this.activeStreamsCount--;
              res.end('data: [DONE]\n\n');
            }
          }, 100);
          req.on('close', () => {
            if (this.mode === 'hardened') {
              clearInterval(interval);
              this.activeStreamsCount = Math.max(0, this.activeStreamsCount - 1);
            }
          });
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      });

      this.server.listen(this.port, () => resolve(this.port));
      this.server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          this.port++;
          this.server?.listen(this.port);
        } else {
          reject(err);
        }
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) this.server.close(() => resolve());
      else resolve();
    });
  }

  getPort(): number {
    return this.port;
  }
}
