import fs from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';

export async function runInitCommand(): Promise<number> {
  const configFile = path.resolve(process.cwd(), 'acid-test.config.json');
  const legacyConfigFile = path.resolve(process.cwd(), 'acidtest.config.json');
  if (fs.existsSync(configFile) || fs.existsSync(legacyConfigFile)) {
    const existing = fs.existsSync(configFile) ? configFile : legacyConfigFile;
    console.log(pc.yellow(`Configuration file already exists at ${existing}`));
    return 0;
  }

  const sampleConfig = {
    $schema: 'https://acid-test.dev/schema.json',
    target: {
      url: 'http://localhost:3000',
      database: 'postgresql://postgres:postgres@localhost:5432/mydb',
      redis: 'redis://localhost:6379',
    },
    fuzzer: {
      concurrency: 10,
      jitterMs: 5,
      timeoutMs: 8000,
    },
    financial: {
      monthlyGmvUsd: 450000,
      averageOrderValueUsd: 50,
    },
    modules: ['billing', 'db', 'auth', 'queue', 'webhook', 'ai', 'email', 'storage'],
  };

  fs.writeFileSync(configFile, JSON.stringify(sampleConfig, null, 2), 'utf8');
  console.log(pc.green(`✓ Created acid-test.config.json in current directory.`));
  console.log(pc.dim(`  Run 'npx @acid-test/cli' to execute your first adversarial reliability audit.`));
  return 0;
}
