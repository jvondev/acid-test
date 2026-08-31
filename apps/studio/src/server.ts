import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';
import { renderStudioHtml } from './client.js';
import { createBillingSuite } from '@acid-test/billing';
import { createDbSuite } from '@acid-test/db';
import { createAuthSuite } from '@acid-test/auth';
import { createQueueSuite } from '@acid-test/queue';
import { createWebhookSuite } from '@acid-test/webhook';
import { createAiSuite } from '@acid-test/ai';
import { createEmailSuite } from '@acid-test/email';
import { createStorageSuite } from '@acid-test/storage';
import { TestRunner } from '@acid-test/core';

export interface StudioServerOptions {
  port?: number;
  host?: string;
  silent?: boolean;
}

export class StudioServer {
  private server?: http.Server;
  private port: number;
  private host: string;
  private silent: boolean;

  constructor(options: StudioServerOptions = {}) {
    this.port = options.port || 4400;
    this.host = options.host || 'localhost';
    this.silent = options.silent ?? false;
  }

  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        const url = new URL(req.url || '/', `http://${this.host}:${this.port}`);
        const pathname = url.pathname;
        const method = req.method || 'GET';

        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        // Serve Visual Studio Client UI
        if (pathname === '/' || pathname === '/index.html') {
          const html = renderStudioHtml();
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(html);
          return;
        }

        // API: Health status
        if (pathname === '/api/status') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', version: '1.0.0', uptime: process.uptime() }));
          return;
        }

        // API: Read AI Remediation payload
        if (pathname === '/api/remediation') {
          const remFile = path.resolve(process.cwd(), '.acidtest/remediation.json');
          if (fs.existsSync(remFile)) {
            const data = fs.readFileSync(remFile, 'utf8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'No remediation file found. Run an audit first.' }));
          }
          return;
        }

        // API: Trigger Invariant Audit Run
        if (pathname === '/api/run' && method === 'POST') {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');

          const suites = [
            createBillingSuite(),
            createDbSuite(),
            createAuthSuite(),
            createQueueSuite(),
            createWebhookSuite(),
            createAiSuite(),
            createEmailSuite(),
            createStorageSuite(),
          ];

          const reportList = [];
          for (const suite of suites) {
            if (!body.module || body.module === suite.category) {
              const report = await TestRunner.runSuite(suite, {
                targetUrl: body.targetUrl || 'http://localhost:3000',
              });
              reportList.push(report);
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, reports: reportList }));
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
      });

      this.server.listen(this.port, this.host, () => {
        if (!this.silent) {
          console.log(pc.cyan(`\n  ┌─────────────────────────────────────────────────────────────┐`));
          console.log(pc.cyan(`  │ `) + pc.bold(pc.white(`ACIDTEST STUDIO RUNNING AT: `)) + pc.bold(pc.green(`http://${this.host}:${this.port}`)).padEnd(30) + pc.cyan(`│`));
          console.log(pc.cyan(`  │ `) + pc.dim(`Realtime event timeline, risk model, and 1-click replay   `) + pc.cyan(`│`));
          console.log(pc.cyan(`  └─────────────────────────────────────────────────────────────┘\n`));
        }
        resolve(this.port);
      });

      this.server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          this.port++;
          this.server?.listen(this.port, this.host);
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
