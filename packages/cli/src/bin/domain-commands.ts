import { Command } from 'commander';
import { runBillingCommand } from '../commands/billing.js';
import { runDbCommand } from '../commands/db.js';
import { runAuthCommand } from '../commands/auth.js';
import { runQueueCommand } from '../commands/queue.js';
import { runWebhookCommand } from '../commands/webhook.js';
import { runAiCommand } from '../commands/ai.js';
import { runEmailCommand } from '../commands/email.js';
import { runStorageCommand } from '../commands/storage.js';

export function registerDomainCommands(program: Command): void {
  const registerBilling = (name: string) =>
    program.command(name).description('Audit billing workflows, webhooks, and ledger idempotency').action(async (opts: any) => { await runBillingCommand({ ...program.opts(), ...opts }); });
  registerBilling('billing'); registerBilling('stripe'); registerBilling('lemonsqueezy'); registerBilling('paddle');

  const registerDb = (name: string) =>
    program.command(name).description('Audit RLS multi-tenant policies, SECURITY DEFINER, and query indexes').action(async (opts: any) => { await runDbCommand({ ...program.opts(), ...opts }); });
  registerDb('db'); registerDb('pg'); registerDb('postgres'); registerDb('supabase'); registerDb('neon');

  const registerAuth = (name: string) =>
    program.command(name).description('Audit tenant separation, session replay, and JWT signature security').action(async (opts: any) => { await runAuthCommand({ ...program.opts(), ...opts }); });
  registerAuth('auth'); registerAuth('clerk'); registerAuth('nextauth'); registerAuth('auth0'); registerAuth('workos');

  const registerQueue = (name: string) =>
    program.command(name).description('Audit background workers, poison pills, and retry backoff').action(async (opts: any) => { await runQueueCommand({ ...program.opts(), ...opts }); });
  registerQueue('queue'); registerQueue('bullmq'); registerQueue('sqs');

  const registerWebhook = (name: string) =>
    program.command(name).description('Audit raw-buffer HMAC, timestamp tolerance, and timingSafeEqual').action(async (opts: any) => { await runWebhookCommand({ ...program.opts(), ...opts }); });
  registerWebhook('webhook'); registerWebhook('shopify'); registerWebhook('slack'); registerWebhook('github'); registerWebhook('svix');

  const registerAi = (name: string) =>
    program.command(name).description('Audit streaming SSE abort signals, schema parsing, and 429 backpressure').action(async (opts: any) => { await runAiCommand({ ...program.opts(), ...opts }); });
  registerAi('ai'); registerAi('openai'); registerAi('anthropic'); registerAi('gemini'); registerAi('ollama');

  const registerEmail = (name: string) =>
    program.command(name).description('Audit transactional templates, fallback parameters, and broken links').action(async (opts: any) => { await runEmailCommand({ ...program.opts(), ...opts }); });
  registerEmail('email'); registerEmail('resend'); registerEmail('postmark'); registerEmail('sendgrid');

  const registerStorage = (name: string) =>
    program.command(name).description('Audit presigned URLs, MIME magic bytes, and public bucket exposure').action(async (opts: any) => { await runStorageCommand({ ...program.opts(), ...opts }); });
  registerStorage('storage'); registerStorage('s3'); registerStorage('r2');
}
