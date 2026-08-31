import http from 'node:http';
import { MultiProviderHmacEngine } from '../crypto/hmac.js';

export interface SandboxServerOptions {
  port?: number;
  mode?: 'vulnerable' | 'hardened';
}

export class SandboxServer {
  private server?: http.Server;
  private port: number;
  private mode: 'vulnerable' | 'hardened';

  // In-memory state tracking
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
        const method = req.method || 'GET';

        // Health probe endpoint
        if (path === '/health' || path === '/') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', mode: this.mode, time: Date.now() }));
          return;
        }

        // Read raw request body
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const rawBody = Buffer.concat(chunks);
        const bodyStr = rawBody.toString('utf8');

        // Route: Billing Webhooks (Stripe / LemonSqueezy)
        if (path.startsWith('/api/webhooks/stripe') || path.startsWith('/api/billing')) {
          if (this.mode === 'vulnerable') {
            // VULNERABLE: Deliberate 15ms race condition window without distributed lock or DB unique constraint
            await new Promise((r) => setTimeout(r, 15));
            try {
              const data = JSON.parse(bodyStr);
              const customerId = data?.data?.object?.customer || 'cus_default';
              const current = this.subscriptions.get(customerId) || { customerId, status: 'active', credits: 0 };
              current.credits += 100; // Race condition: double-credit!
              this.subscriptions.set(customerId, current);

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ received: true, credits: current.credits }));
            } catch {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'invalid json' }));
            }
          } else {
            // HARDENED: Idempotent processing with duplicate event lock
            try {
              const data = JSON.parse(bodyStr);
              const eventId = data?.id;
              if (eventId && this.processedEventIds.has(eventId)) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ received: true, deduplicated: true }));
                return;
              }
              if (eventId) this.processedEventIds.add(eventId);

              const customerId = data?.data?.object?.customer || 'cus_default';
              const current = this.subscriptions.get(customerId) || { customerId, status: 'active', credits: 0 };
              current.credits += 100;
              this.subscriptions.set(customerId, current);

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ received: true, credits: current.credits }));
            } catch {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'invalid json' }));
            }
          }
          return;
        }

        // Route: Webhook Ingress (Shopify / Slack / GitHub / Svix / Stripe)
        if (
          path.startsWith('/api/webhooks/shopify') ||
          path.startsWith('/api/webhooks/raw') ||
          path.startsWith('/api/webhooks')
        ) {
          const stripeSig = (req.headers['stripe-signature'] as string) || '';
          const shopifySig = (req.headers['x-shopify-hmac-sha256'] as string) || '';

          if (this.mode === 'hardened') {
            // Check Stripe timestamp tolerance
            if (stripeSig && stripeSig.includes('t=')) {
              const match = stripeSig.match(/t=(\d+)/);
              if (match) {
                const ts = parseInt(match[1], 10);
                const now = Math.floor(Date.now() / 1000);
                if (Math.abs(now - ts) > 300) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Timestamp outside tolerance window' }));
                  return;
                }
              }
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ verified: true, timingSafe: true }));
          } else {
            // VULNERABLE
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ verified: true }));
          }
          return;
        }

        // Route: Auth / Tenant Hopping & JWT
        if (
          path.startsWith('/api/org') ||
          path.startsWith('/api/auth') ||
          path.startsWith('/api/user') ||
          path.startsWith('/api/admin')
        ) {
          const authHeader = req.headers['authorization'] || '';

          if (this.mode === 'hardened') {
            // Check alg none
            if (authHeader.includes('eyJhbGciOiJub25l')) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Unauthorized: algorithm none rejected' }));
              return;
            }

            // Check logout token replay
            if (authHeader.includes('usr_logout_test') || path.includes('/user/me')) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Unauthorized: session revoked' }));
              return;
            }

            // Check cross-tenant access
            if (path.includes('org_beta') || bodyStr.includes('org_beta')) {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Forbidden: caller does not belong to org_beta' }));
              return;
            }

            // Profile update (strip unwhitelisted mass assignment)
            if (path.includes('/profile')) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ name: 'John Doe', role: 'member' }));
              return;
            }

            // Refresh token
            if (path.includes('/refresh')) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ accessToken: 'new_token_123', refreshToken: 'new_refresh_456' }));
              return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } else {
            // VULNERABLE
            if (path.includes('/profile')) {
              try {
                const body = JSON.parse(bodyStr);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(body)); // Vulnerable: echoes back role: admin!
              } catch {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
              }
              return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, crossTenant: true }));
          }
          return;
        }

        // Route: Queue poison pill
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
            // Hardened: DLQ catch
            try {
              JSON.parse(bodyStr);
            } catch {
              this.deadLetterQueue.push(bodyStr);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ enqueued: true, routedToDlq: this.deadLetterQueue.length > 0 }));
          }
          return;
        }

        // Route: AI Streaming SSE & Structured Output
        if (path.startsWith('/api/chat') || path.startsWith('/api/ai/stream')) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          });

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

        if (path.startsWith('/api/generate')) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ title: 'Report', count: 42 }));
          return;
        }

        // Default 200/404
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      });

      this.server.listen(this.port, () => {
        resolve(this.port);
      });

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
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  getPort(): number {
    return this.port;
  }
}
