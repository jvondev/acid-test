import type { DetectedService, DetectedDomain } from './types.js';
import { EnvScanner } from './env-scanner.js';

export class ServiceScanner {
  static scan(projectRoot: string, deps: Record<string, string>, envVars: Record<string, string>): {
    detectedServices: DetectedService[];
    discoveredRoutes: { domain: DetectedDomain; path: string; filePath: string }[];
    discoveredSchemas: string[];
  } {
    const detectedServices: DetectedService[] = [];
    const discoveredRoutes: { domain: DetectedDomain; path: string; filePath: string }[] = [];
    const discoveredSchemas: string[] = [];

    // 1. DB
    const dbFiles = EnvScanner.findMatchingFiles(projectRoot, ['prisma/schema.prisma', 'drizzle.config.ts', 'drizzle.config.js', 'schema.sql', 'supabase/migrations', 'migrations', 'db/schema']);
    discoveredSchemas.push(...dbFiles);
    if (deps['pg'] || deps['@neondatabase/serverless'] || deps['@prisma/client'] || deps['drizzle-orm'] || deps['supabase'] || dbFiles.length > 0 || envVars['DATABASE_URL']) {
      let provider = 'postgresql';
      if (deps['@neondatabase/serverless']) provider = 'neon';
      else if (deps['@supabase/supabase-js'] || deps['supabase']) provider = 'supabase';
      detectedServices.push({ domain: 'db', provider, source: dbFiles.length > 0 ? 'schema_file' : (envVars['DATABASE_URL'] ? 'env_var' : 'package_json'), evidence: dbFiles.length > 0 ? `Found schema at ${dbFiles[0]}` : (envVars['DATABASE_URL'] ? 'DATABASE_URL found in .env' : 'Database client dependency detected'), files: dbFiles });
    }

    // 2. Billing
    const billingRoutes = EnvScanner.findMatchingFiles(projectRoot, ['app/api/webhooks/stripe', 'app/api/webhooks/lemonsqueezy', 'app/api/webhooks/paddle', 'pages/api/webhooks/stripe', 'pages/api/stripe', 'src/routes/billing']);
    discoveredRoutes.push(...billingRoutes.map(f => ({ domain: 'billing' as DetectedDomain, path: '/api/webhooks/stripe', filePath: f })));
    if (deps['stripe'] || deps['@stripe/stripe-js'] || deps['@lemonsqueezy/lemonsqueezy.js'] || deps['@paddle/paddle-node-sdk'] || envVars['STRIPE_SECRET_KEY'] || envVars['STRIPE_WEBHOOK_SECRET'] || billingRoutes.length > 0) {
      let provider = 'stripe';
      if (deps['@lemonsqueezy/lemonsqueezy.js'] || envVars['LEMONSQUEEZY_API_KEY']) provider = 'lemonsqueezy';
      else if (deps['@paddle/paddle-node-sdk']) provider = 'paddle';
      detectedServices.push({ domain: 'billing', provider, source: billingRoutes.length > 0 ? 'route_file' : (envVars['STRIPE_SECRET_KEY'] ? 'env_var' : 'package_json'), evidence: billingRoutes.length > 0 ? `Route detected: ${billingRoutes[0]}` : 'Billing SDK / Secret detected', files: billingRoutes });
    }

    // 3. Auth
    const authRoutes = EnvScanner.findMatchingFiles(projectRoot, ['app/api/auth', 'pages/api/auth', 'src/routes/auth', 'middleware.ts', 'middleware.js']);
    if (deps['@clerk/nextjs'] || deps['@clerk/backend'] || deps['next-auth'] || deps['@auth/core'] || deps['auth0'] || deps['@workos-inc/node'] || envVars['CLERK_SECRET_KEY'] || envVars['NEXTAUTH_SECRET'] || authRoutes.length > 0) {
      let provider = 'clerk';
      if (deps['next-auth'] || deps['@auth/core']) provider = 'nextauth';
      else if (deps['auth0']) provider = 'auth0';
      else if (deps['@workos-inc/node']) provider = 'workos';
      detectedServices.push({ domain: 'auth', provider, source: authRoutes.length > 0 ? 'route_file' : 'package_json', evidence: authRoutes.length > 0 ? `Auth route/middleware detected: ${authRoutes[0]}` : 'Auth provider dependency detected', files: authRoutes });
    }

    // 4. Queue
    if (deps['bullmq'] || deps['bull'] || deps['ioredis'] || deps['@aws-sdk/client-sqs'] || deps['@upstash/qstash'] || envVars['REDIS_URL']) {
      let provider = 'bullmq';
      if (deps['@aws-sdk/client-sqs']) provider = 'sqs';
      else if (deps['@upstash/qstash']) provider = 'qstash';
      detectedServices.push({ domain: 'queue', provider, source: envVars['REDIS_URL'] ? 'env_var' : 'package_json', evidence: envVars['REDIS_URL'] ? 'REDIS_URL in environment' : 'Distributed queue client dependency detected', files: [] });
    }

    // 5. Webhook Ingress
    const webhookRoutes = EnvScanner.findMatchingFiles(projectRoot, ['app/api/webhooks', 'pages/api/webhooks', 'src/routes/webhooks', 'routes/webhooks']);
    if (deps['@shopify/shopify-api'] || deps['@slack/bolt'] || deps['@octokit/webhooks'] || deps['svix'] || webhookRoutes.length > 0) {
      let provider = 'shopify';
      if (deps['@slack/bolt']) provider = 'slack';
      else if (deps['@octokit/webhooks']) provider = 'github';
      else if (deps['svix']) provider = 'svix';
      detectedServices.push({ domain: 'webhook', provider, source: webhookRoutes.length > 0 ? 'route_file' : 'package_json', evidence: webhookRoutes.length > 0 ? `Webhook directory detected at ${webhookRoutes[0]}` : 'Webhook handler dependency detected', files: webhookRoutes });
    }

    // 6. AI Gateway
    const aiRoutes = EnvScanner.findMatchingFiles(projectRoot, ['app/api/chat', 'app/api/generate', 'pages/api/chat', 'src/routes/ai']);
    if (deps['openai'] || deps['@anthropic-ai/sdk'] || deps['@google/genai'] || deps['@google/generative-ai'] || deps['ai'] || deps['ollama'] || envVars['OPENAI_API_KEY'] || envVars['ANTHROPIC_API_KEY']) {
      let provider = 'openai';
      if (deps['@anthropic-ai/sdk'] || envVars['ANTHROPIC_API_KEY']) provider = 'anthropic';
      else if (deps['@google/genai'] || deps['@google/generative-ai']) provider = 'gemini';
      detectedServices.push({ domain: 'ai', provider, source: aiRoutes.length > 0 ? 'route_file' : (envVars['OPENAI_API_KEY'] ? 'env_var' : 'package_json'), evidence: envVars['OPENAI_API_KEY'] ? 'OPENAI_API_KEY in environment' : 'AI SDK dependency detected', files: aiRoutes });
    }

    // 7. Email
    if (deps['resend'] || deps['postmark'] || deps['@sendgrid/mail'] || deps['nodemailer'] || envVars['RESEND_API_KEY'] || envVars['SENDGRID_API_KEY']) {
      let provider = 'resend';
      if (deps['postmark']) provider = 'postmark';
      else if (deps['@sendgrid/mail'] || envVars['SENDGRID_API_KEY']) provider = 'sendgrid';
      detectedServices.push({ domain: 'email', provider, source: envVars['RESEND_API_KEY'] ? 'env_var' : 'package_json', evidence: envVars['RESEND_API_KEY'] ? 'RESEND_API_KEY in environment' : 'Transactional email SDK detected', files: [] });
    }

    // 8. Storage
    if (deps['@aws-sdk/client-s3'] || deps['@google-cloud/storage'] || envVars['AWS_S3_BUCKET'] || envVars['S3_BUCKET'] || envVars['R2_BUCKET_NAME']) {
      let provider = 's3';
      if (envVars['R2_BUCKET_NAME']) provider = 'r2';
      detectedServices.push({ domain: 'storage', provider, source: envVars['AWS_S3_BUCKET'] ? 'env_var' : 'package_json', evidence: envVars['AWS_S3_BUCKET'] ? 'S3 bucket configuration in environment' : 'Cloud storage SDK detected', files: [] });
    }

    return { detectedServices, discoveredRoutes, discoveredSchemas };
  }
}
