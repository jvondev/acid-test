#!/usr/bin/env node
import { Command } from 'commander';
import { runAudit } from '../commands/audit.js';
import { runDemoCommand } from '../commands/demo.js';
import { runStudioCommand } from '../commands/studio.js';
import { runInitCommand } from '../commands/init.js';
import { runInteractiveTui } from '../tui/index.js';
import { registerDomainCommands } from './domain-commands.js';

const program = new Command();

program
  .name('acid-test')
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
  .option('--tui', 'Launch interactive full-screen Terminal UI')
  .option('--ci', 'Enforce strict CI exit code (exit code 1 on invariant failures)')
  .option('--studio', 'Launch local visual Studio on port 4400 after execution');

// 1. Audit command (default when no args passed)
program
  .command('audit [modules...]')
  .description('Audit all or specified domain modules against ACID invariants')
  .action(async (modules: string[], options: any) => {
    const opts = { ...program.opts(), ...options };
    if (opts.tui) {
      await runInteractiveTui({ url: opts.url });
      return;
    }

    const exitCode = await runAudit(modules || [], opts);
    if (opts.studio) {
      await runStudioCommand({ port: opts.studioPort || '4400' });
    }
    if (exitCode !== 0 && opts.ci) {
      process.exit(exitCode);
    }
  });

// 2. Interactive TUI Command
program
  .command('tui')
  .alias('interactive')
  .description('Launch interactive full-screen React Terminal UI')
  .action(async (options: any) => {
    const opts = { ...program.opts(), ...options };
    await runInteractiveTui({ url: opts.url });
  });

// 3. Register domain commands & platform aliases
registerDomainCommands(program);

// 4. Demo / Fuzz command
program
  .command('demo')
  .alias('fuzz')
  .description('Run live adversarial proving ground against in-memory vulnerable vs hardened targets')
  .action(async () => {
    await runDemoCommand();
  });

// 5. Studio UI
program
  .command('studio')
  .alias('ui')
  .description('Launch zero-config local visual web studio on localhost:4400')
  .option('-p, --port <port>', 'Studio port', '4400')
  .action(async (options: any) => {
    const opts = { ...program.opts(), ...options };
    await runStudioCommand({ port: opts.port || '4400' });
  });

// 6. Init / Config Scaffold
program
  .command('init')
  .alias('setup')
  .description('Scaffold acid-test.config.json configuration file in current directory')
  .action(async () => {
    await runInitCommand();
  });

// Default to audit command if no subcommands provided
if (process.argv.length <= 2) {
  process.argv.push('audit');
}

program.parse(process.argv);
