#!/usr/bin/env node
import { Command } from 'commander';
import pc from 'picocolors';
import { runAudit } from '../commands/audit.js';
import { runBillingCommand } from '../commands/billing.js';
import { runDbCommand } from '../commands/db.js';
import { runAuthCommand } from '../commands/auth.js';
import { runQueueCommand } from '../commands/queue.js';
import { runWebhookCommand } from '../commands/webhook.js';
import { runAiCommand } from '../commands/ai.js';
import { runEmailCommand } from '../commands/email.js';
import { runStorageCommand } from '../commands/storage.js';
import { runStudioCommand } from '../commands/studio.js';
import { runDemoCommand } from '../commands/demo.js';
import { runInitCommand } from '../commands/init.js';

const program = new Command();

program
  .name('acidtest')
  .description('The definitive ACID reliability, security, and chaos-testing suite for distributed backends')
  .version('1.0.0')
  .option('-u, --url <url>', 'Target endpoint URL (default: http://localhost:3000)')
  .option('-d, --db <dbUrl>', 'Database connection string (PostgreSQL/Supabase/Neon)')
  .option('-r, --redis <redisUrl>', 'Redis connection string (BullMQ / Streams)')
  .option('-s, --secret <secret>', 'Webhook HMAC signing secret key')
  .option('-c, --concurrency <number>', 'Concurrent burst concurrency limit', '10')
  .option('-j, --jitter <ms>', 'Microsecond/millisecond jitter window in ms', '5')
  .option('--gmv <usd>', 'Monthly GMV transaction volume for financial risk modeling')
  .option('--ticket-size <usd>', 'Average ticket order value in USD')
  .option('--ci', 'Enforce strict CI exit code (exit code 1 on invariant failures)')
  .option('--studio', 'Launch local visual Studio on port 4400 after execution')
  .action(async (options) => {
    const exitCode = await runAudit([], options);
    if (options.studio) {
      await runStudioCommand({});
    }
    process.exit(exitCode);
  });

// Domain: Audit All or Selected
program
  .command('audit [modules...]')
  .description('Audit all or specified domain modules against ACID invariants')
  .action(async (modules, options, cmd) => {
    const opts = cmd.optsWithGlobals();
    const exitCode = await runAudit(modules || [], opts);
    if (opts.studio) {
      await runStudioCommand({});
    }
    process.exit(exitCode);
  });

// Domain: Billing (Aliases: stripe, lemonsqueezy, paddle)
function registerBilling(name: string, provider: string) {
  program
    .command(name)
    .description(`Audit ${provider.toUpperCase()} billing workflows, webhooks, and ledger idempotency`)
    .action(async (options, cmd) => {
      const opts = { ...cmd.optsWithGlobals(), provider };
      const exitCode = await runBillingCommand(opts);
      if (opts.studio) await runStudioCommand({});
      process.exit(exitCode);
    });
}
registerBilling('billing', 'stripe');
registerBilling('stripe', 'stripe');
registerBilling('lemonsqueezy', 'lemonsqueezy');
registerBilling('paddle', 'paddle');

// Domain: Database (Aliases: db, pg, postgres, supabase, neon)
function registerDb(name: string, provider: string) {
  program
    .command(name)
    .description(`Audit ${provider.toUpperCase()} RLS multi-tenant policies, SECURITY DEFINER, and query indexes`)
    .action(async (options, cmd) => {
      const opts = { ...cmd.optsWithGlobals(), provider };
      const exitCode = await runDbCommand(opts);
      if (opts.studio) await runStudioCommand({});
      process.exit(exitCode);
    });
}
registerDb('db', 'postgresql');
registerDb('pg', 'postgresql');
registerDb('postgres', 'postgresql');
registerDb('supabase', 'postgresql');
registerDb('neon', 'postgresql');

// Domain: Auth (Aliases: auth, clerk, nextauth, auth0, workos)
function registerAuth(name: string, provider: string) {
  program
    .command(name)
    .description(`Audit ${provider.toUpperCase()} tenant separation, session replay, and JWT signature security`)
    .action(async (options, cmd) => {
      const opts = { ...cmd.optsWithGlobals(), provider };
      const exitCode = await runAuthCommand(opts);
      if (opts.studio) await runStudioCommand({});
      process.exit(exitCode);
    });
}
registerAuth('auth', 'clerk');
registerAuth('clerk', 'clerk');
registerAuth('nextauth', 'nextauth');
registerAuth('auth0', 'auth0');
registerAuth('workos', 'workos');

// Domain: Queue (Aliases: queue, bullmq, redis-queue, sqs)
function registerQueue(name: string, provider: string) {
  program
    .command(name)
    .description(`Audit ${provider.toUpperCase()} background workers, poison pills, and retry backoff`)
    .action(async (options, cmd) => {
      const opts = { ...cmd.optsWithGlobals(), provider };
      const exitCode = await runQueueCommand(opts);
      if (opts.studio) await runStudioCommand({});
      process.exit(exitCode);
    });
}
registerQueue('queue', 'bullmq');
registerQueue('bullmq', 'bullmq');
registerQueue('sqs', 'sqs');

// Domain: Webhook (Aliases: webhook, shopify, slack, github, svix)
function registerWebhook(name: string, provider: string) {
  program
    .command(name)
    .description(`Audit ${provider.toUpperCase()} raw-buffer HMAC, timestamp tolerance, and timingSafeEqual`)
    .action(async (options, cmd) => {
      const opts = { ...cmd.optsWithGlobals(), provider };
      const exitCode = await runWebhookCommand(opts);
      if (opts.studio) await runStudioCommand({});
      process.exit(exitCode);
    });
}
registerWebhook('webhook', 'shopify');
registerWebhook('shopify', 'shopify');
registerWebhook('slack', 'slack');
registerWebhook('github', 'github');
registerWebhook('svix', 'svix');

// Domain: AI (Aliases: ai, openai, anthropic, gemini, ollama)
function registerAi(name: string, provider: string) {
  program
    .command(name)
    .description(`Audit ${provider.toUpperCase()} streaming SSE abort signals, schema parsing, and 429 backpressure`)
    .action(async (options, cmd) => {
      const opts = { ...cmd.optsWithGlobals(), provider };
      const exitCode = await runAiCommand(opts);
      if (opts.studio) await runStudioCommand({});
      process.exit(exitCode);
    });
}
registerAi('ai', 'openai');
registerAi('openai', 'openai');
registerAi('anthropic', 'anthropic');
registerAi('gemini', 'gemini');
registerAi('ollama', 'ollama');

// Domain: Email (Aliases: email, resend, postmark, sendgrid)
function registerEmail(name: string, provider: string) {
  program
    .command(name)
    .description(`Audit ${provider.toUpperCase()} transactional templates, fallback parameters, and broken links`)
    .action(async (options, cmd) => {
      const opts = { ...cmd.optsWithGlobals(), provider };
      const exitCode = await runEmailCommand(opts);
      if (opts.studio) await runStudioCommand({});
      process.exit(exitCode);
    });
}
registerEmail('email', 'resend');
registerEmail('resend', 'resend');
registerEmail('postmark', 'postmark');
registerEmail('sendgrid', 'sendgrid');

// Domain: Storage (Aliases: storage, s3, r2)
function registerStorage(name: string, provider: string) {
  program
    .command(name)
    .description(`Audit ${provider.toUpperCase()} presigned URLs, MIME magic bytes, and public bucket exposure`)
    .action(async (options, cmd) => {
      const opts = { ...cmd.optsWithGlobals(), provider };
      const exitCode = await runStorageCommand(opts);
      if (opts.studio) await runStudioCommand({});
      process.exit(exitCode);
    });
}
registerStorage('storage', 's3');
registerStorage('s3', 's3');
registerStorage('r2', 'r2');

// Demo command: live adversarial sandbox comparison
program
  .command('demo')
  .alias('fuzz')
  .description('Run live adversarial proving ground against in-memory vulnerable vs hardened targets')
  .action(async () => {
    const exitCode = await runDemoCommand();
    process.exit(exitCode);
  });

// Studio command: launch visual dashboard
program
  .command('studio')
  .alias('ui')
  .description('Launch zero-config local visual web studio on localhost:4400')
  .option('-p, --port <port>', 'Studio port (default: 4400)', '4400')
  .option('-h, --host <host>', 'Studio host (default: localhost)', 'localhost')
  .action(async (options) => {
    await runStudioCommand(options);
  });

// Init command: scaffold acidtest.config.json
program
  .command('init')
  .alias('setup')
  .description('Scaffold acidtest.config.json configuration file in current directory')
  .action(async () => {
    const exitCode = await runInitCommand();
    process.exit(exitCode);
  });

program.parse(process.argv);
