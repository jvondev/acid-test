import type { InvariantResult } from '@acidtest/core';

export interface CodeDiffSnippet {
  file: string;
  startLine: number;
  lines: { type: 'context' | 'remove' | 'add'; lineNum: number; code: string }[];
}

export function getCodeDiffForInvariant(result?: InvariantResult): CodeDiffSnippet {
  if (!result) {
    return {
      file: 'app/api/route.ts',
      startLine: 1,
      lines: [
        { type: 'context', lineNum: 1, code: '// Select an invariant to inspect code remediation' },
      ],
    };
  }

  const id = result.testId.toUpperCase();

  // 1. BILLING DOMAIN
  if (id.includes('BILLING-001') || id.includes('BIL-001')) {
    return {
      file: result.failingFile || 'app/api/webhooks/stripe/route.ts',
      startLine: 31,
      lines: [
        { type: 'context', lineNum: 31, code: 'export async function POST(req: Request) {' },
        { type: 'context', lineNum: 32, code: '  const event = await parseStripeEvent(req);' },
        { type: 'remove', lineNum: 33, code: '- await db.subscription.create({ data: { user: event.userId, status: "ACTIVE" } });' },
        { type: 'add', lineNum: 33, code: '+ await db.$transaction(async (tx) => {' },
        { type: 'add', lineNum: 34, code: '+   const exists = await tx.eventLock.findUnique({ where: { eventId: event.id } });' },
        { type: 'add', lineNum: 35, code: '+   if (exists) return; // Idempotent skip' },
        { type: 'add', lineNum: 36, code: '+   await tx.subscription.create({ data: { user: event.userId, status: "ACTIVE" } });' },
        { type: 'add', lineNum: 37, code: '+ });' },
        { type: 'context', lineNum: 38, code: '  return NextResponse.json({ received: true });' },
      ],
    };
  }

  if (id.includes('BILLING-002') || id.includes('BIL-002')) {
    return {
      file: result.failingFile || 'app/api/webhooks/stripe/route.ts',
      startLine: 18,
      lines: [
        { type: 'context', lineNum: 18, code: 'const rawBody = await req.text();' },
        { type: 'remove', lineNum: 19, code: '- const sig = req.headers.get("stripe-signature");' },
        { type: 'add', lineNum: 19, code: '+ const payloadHash = crypto.createHash("sha256").update(rawBody).digest("hex");' },
        { type: 'add', lineNum: 20, code: '+ const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);' },
        { type: 'add', lineNum: 21, code: '+ await verifyPayloadFingerprint(event.id, payloadHash);' },
      ],
    };
  }

  if (id.includes('BILLING-003') || id.includes('BIL-003')) {
    return {
      file: result.failingFile || 'services/billing/dunning-engine.ts',
      startLine: 42,
      lines: [
        { type: 'context', lineNum: 42, code: 'export async function handleInvoicePaid(invoice: Stripe.Invoice) {' },
        { type: 'remove', lineNum: 43, code: '- if (invoice.attempt_count > 3) throw new Error("Dunning expired");' },
        { type: 'add', lineNum: 43, code: '+ // Payment success immediately heals delinquent subscription' },
        { type: 'add', lineNum: 44, code: '+ await db.subscription.update({' },
        { type: 'add', lineNum: 45, code: '+   where: { stripeCustomerId: invoice.customer as string },' },
        { type: 'add', lineNum: 46, code: '+   data: { status: "ACTIVE", dunningAttempts: 0, gracePeriodEnd: null }' },
        { type: 'add', lineNum: 47, code: '+ });' },
      ],
    };
  }

  if (id.includes('BILLING-004') || id.includes('BIL-004')) {
    return {
      file: result.failingFile || 'services/billing/subscription-sync.ts',
      startLine: 55,
      lines: [
        { type: 'context', lineNum: 55, code: 'export async function syncSubscriptionState(event: StripeEvent) {' },
        { type: 'remove', lineNum: 56, code: '- await db.subscription.update({ where: { id }, data: { plan: event.plan } });' },
        { type: 'add', lineNum: 56, code: '+ // Guard against out-of-order webhook delivery with timestamp check' },
        { type: 'add', lineNum: 57, code: '+ await db.$executeRaw`UPDATE subscriptions SET plan = ${event.plan}' },
        { type: 'add', lineNum: 58, code: '+   WHERE id = ${id} AND last_event_created_at <= ${event.created};`;' },
      ],
    };
  }

  if (id.includes('BILLING-005') || id.includes('BIL-005')) {
    return {
      file: result.failingFile || 'lib/money/currency-converter.ts',
      startLine: 12,
      lines: [
        { type: 'context', lineNum: 12, code: 'export function toStripeCents(amount: number, currency: string): number {' },
        { type: 'remove', lineNum: 13, code: '- return Math.round(amount * 100);' },
        { type: 'add', lineNum: 13, code: '+ const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW", "VND", "CLP"]);' },
        { type: 'add', lineNum: 14, code: '+ if (ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase())) return Math.round(amount);' },
        { type: 'add', lineNum: 15, code: '+ return Math.round(amount * 100);' },
      ],
    };
  }

  if (id.includes('BILLING-006') || id.includes('BIL-006')) {
    return {
      file: result.failingFile || 'app/api/checkout/success/route.ts',
      startLine: 24,
      lines: [
        { type: 'context', lineNum: 24, code: 'export async function fulfillOrder(session: Stripe.Checkout.Session) {' },
        { type: 'remove', lineNum: 25, code: '- await db.order.create({ data: { sessionId: session.id, paid: true } });' },
        { type: 'add', lineNum: 25, code: '+ // Idempotent upsert with unique session constraint' },
        { type: 'add', lineNum: 26, code: '+ await db.order.upsert({' },
        { type: 'add', lineNum: 27, code: '+   where: { stripeSessionId: session.id },' },
        { type: 'add', lineNum: 28, code: '+   update: { paid: true },' },
        { type: 'add', lineNum: 29, code: '+   create: { stripeSessionId: session.id, paid: true }' },
        { type: 'add', lineNum: 30, code: '+ });' },
      ],
    };
  }

  // 2. DATABASE DOMAIN
  if (id.includes('DB-001')) {
    return {
      file: result.failingFile || 'prisma/schema.prisma',
      startLine: 1,
      lines: [
        { type: 'context', lineNum: 1, code: '-- Enforce Row Level Security (RLS) on multi-tenant table' },
        { type: 'remove', lineNum: 2, code: '- SELECT * FROM tenant_organizations WHERE id = $1;' },
        { type: 'add', lineNum: 2, code: '+ ALTER TABLE tenant_organizations ENABLE ROW LEVEL SECURITY;' },
        { type: 'add', lineNum: 3, code: '+ CREATE POLICY tenant_isolation_policy ON tenant_organizations' },
        { type: 'add', lineNum: 4, code: '+   USING (tenant_id = current_setting(\'app.current_tenant_id\')::uuid);' },
      ],
    };
  }

  if (id.includes('DB-002')) {
    return {
      file: result.failingFile || 'supabase/migrations/20260101_functions.sql',
      startLine: 8,
      lines: [
        { type: 'context', lineNum: 8, code: 'CREATE OR REPLACE FUNCTION admin_privileged_lookup()' },
        { type: 'context', lineNum: 9, code: 'RETURNS void SECURITY DEFINER' },
        { type: 'remove', lineNum: 10, code: '- AS $$ ... $$;' },
        { type: 'add', lineNum: 10, code: '+ SET search_path = public, pg_temp' },
        { type: 'add', lineNum: 11, code: '+ AS $$ ... $$;' },
      ],
    };
  }

  if (id.includes('DB-003')) {
    return {
      file: result.failingFile || 'db/migrations/add_composite_index.sql',
      startLine: 1,
      lines: [
        { type: 'context', lineNum: 1, code: '-- Eliminate full-table sequential scan on high-volume queries' },
        { type: 'remove', lineNum: 2, code: '- SELECT * FROM audit_logs WHERE tenant_id = $1 ORDER BY created_at DESC;' },
        { type: 'add', lineNum: 2, code: '+ CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_tenant_created' },
        { type: 'add', lineNum: 3, code: '+   ON audit_logs (tenant_id, created_at DESC);' },
      ],
    };
  }

  if (id.includes('DB-004')) {
    return {
      file: result.failingFile || 'services/db/transaction-helpers.ts',
      startLine: 29,
      lines: [
        { type: 'context', lineNum: 29, code: 'export async function transferCredits(fromId: string, toId: string, amount: number) {' },
        { type: 'remove', lineNum: 30, code: '- await db.account.update({ where: { id: fromId }, data: { ... } });' },
        { type: 'add', lineNum: 30, code: '+ // Lock rows in deterministic ascending order to prevent deadlocks' },
        { type: 'add', lineNum: 31, code: '+ const [firstId, secondId] = [fromId, toId].sort();' },
        { type: 'add', lineNum: 32, code: '+ await db.$executeRaw`SELECT id FROM accounts WHERE id IN (${firstId}, ${secondId}) ORDER BY id FOR UPDATE`;' },
      ],
    };
  }

  // 3. AUTH DOMAIN
  if (id.includes('AUTH-001')) {
    return {
      file: result.failingFile || 'app/api/organizations/[orgId]/route.ts',
      startLine: 14,
      lines: [
        { type: 'context', lineNum: 14, code: 'export async function GET(req: Request, { params }: RouteParams) {' },
        { type: 'context', lineNum: 15, code: '  const session = await getSession(req);' },
        { type: 'remove', lineNum: 16, code: '- const org = await db.organization.findUnique({ where: { id: params.orgId } });' },
        { type: 'add', lineNum: 16, code: '+ if (session.organizationId !== params.orgId && session.role !== "SUPERADMIN") {' },
        { type: 'add', lineNum: 17, code: '+   return NextResponse.json({ error: "Unauthorized tenant access" }, { status: 403 });' },
        { type: 'add', lineNum: 18, code: '+ }' },
      ],
    };
  }

  if (id.includes('AUTH-002')) {
    return {
      file: result.failingFile || 'middleware/auth-validator.ts',
      startLine: 22,
      lines: [
        { type: 'context', lineNum: 22, code: 'export async function validateSessionToken(token: string) {' },
        { type: 'remove', lineNum: 23, code: '- return jwt.verify(token, process.env.JWT_SECRET!);' },
        { type: 'add', lineNum: 23, code: '+ const isRevoked = await redis.get(`revoked_token:${token}`);' },
        { type: 'add', lineNum: 24, code: '+ if (isRevoked) throw new UnauthorizedError("Session has been revoked");' },
        { type: 'add', lineNum: 25, code: '+ return jwt.verify(token, process.env.JWT_SECRET!);' },
      ],
    };
  }

  if (id.includes('AUTH-003')) {
    return {
      file: result.failingFile || 'lib/auth/jwt.ts',
      startLine: 15,
      lines: [
        { type: 'context', lineNum: 15, code: 'export function verifyJwt(token: string) {' },
        { type: 'remove', lineNum: 16, code: '- return jwt.verify(token, publicKey);' },
        { type: 'add', lineNum: 16, code: '+ // Explicitly reject "none" algorithm attacks' },
        { type: 'add', lineNum: 17, code: '+ return jwt.verify(token, publicKey, { algorithms: ["RS256", "EdDSA"] });' },
      ],
    };
  }

  // 4. WEBHOOK DOMAIN
  if (id.includes('WEBHOOK-001') || id.includes('HOOK-001')) {
    return {
      file: result.failingFile || 'app/api/webhooks/route.ts',
      startLine: 10,
      lines: [
        { type: 'context', lineNum: 10, code: 'export async function POST(req: NextRequest) {' },
        { type: 'remove', lineNum: 11, code: '- const body = await req.json(); // Parses body and corrupts HMAC raw bytes' },
        { type: 'add', lineNum: 11, code: '+ const rawBuffer = await req.text(); // Preserve exact raw byte buffer' },
        { type: 'add', lineNum: 12, code: '+ const signature = req.headers.get("x-signature-sha256");' },
        { type: 'add', lineNum: 13, code: '+ verifyHmacSignature(rawBuffer, signature, process.env.WEBHOOK_SECRET!);' },
      ],
    };
  }

  if (id.includes('WEBHOOK-002') || id.includes('HOOK-002')) {
    return {
      file: result.failingFile || 'lib/security/webhook-validator.ts',
      startLine: 20,
      lines: [
        { type: 'context', lineNum: 20, code: 'export function verifyTimestamp(headerTimestamp: number) {' },
        { type: 'remove', lineNum: 21, code: '- return true;' },
        { type: 'add', lineNum: 21, code: '+ const DRIFT_TOLERANCE_SECONDS = 300; // 5 minutes' },
        { type: 'add', lineNum: 22, code: '+ const now = Math.floor(Date.now() / 1000);' },
        { type: 'add', lineNum: 23, code: '+ if (Math.abs(now - headerTimestamp) > DRIFT_TOLERANCE_SECONDS) {' },
        { type: 'add', lineNum: 24, code: '+   throw new Error("Webhook timestamp expired or replay attack detected");' },
        { type: 'add', lineNum: 25, code: '+ }' },
      ],
    };
  }

  // 5. QUEUE DOMAIN
  if (id.includes('QUEUE') || id.includes('QUE-')) {
    return {
      file: result.failingFile || 'workers/queue-processor.ts',
      startLine: 18,
      lines: [
        { type: 'context', lineNum: 18, code: 'export async function processJob(job: Job) {' },
        { type: 'remove', lineNum: 19, code: '- const data = JSON.parse(job.data); await handle(data);' },
        { type: 'add', lineNum: 19, code: '+ const schema = jobPayloadSchema.safeParse(job.data);' },
        { type: 'add', lineNum: 20, code: '+ if (!schema.success) {' },
        { type: 'add', lineNum: 21, code: '+   await moveToDeadLetterQueue(job, schema.error);' },
        { type: 'add', lineNum: 22, code: '+   return;' },
        { type: 'add', lineNum: 23, code: '+ }' },
      ],
    };
  }

  // 6. AI GATEWAY DOMAIN
  if (id.includes('AI-') || id.includes('LLM-')) {
    return {
      file: result.failingFile || 'services/ai/streaming-handler.ts',
      startLine: 35,
      lines: [
        { type: 'context', lineNum: 35, code: 'export async function streamCompletion(req: Request) {' },
        { type: 'remove', lineNum: 36, code: '- const stream = await openai.chat.completions.create({ stream: true, ... });' },
        { type: 'add', lineNum: 36, code: '+ // Abort upstream LLM token stream when client disconnects' },
        { type: 'add', lineNum: 37, code: '+ const stream = await openai.chat.completions.create({' },
        { type: 'add', lineNum: 38, code: '+   stream: true, signal: req.signal, model: "gpt-4o", messages' },
        { type: 'add', lineNum: 39, code: '+ });' },
      ],
    };
  }

  // Generic fallback with actual invariant recommendation
  return {
    file: result.failingFile || 'src/invariants/handler.ts',
    startLine: result.lineNumber || 24,
    lines: [
      { type: 'context', lineNum: result.lineNumber || 24, code: `// Invariant: [${result.testId}] ${result.testName}` },
      { type: 'remove', lineNum: (result.lineNumber || 24) + 1, code: `- // Vulnerable: Unsynchronized state mutation without isolation` },
      { type: 'add', lineNum: (result.lineNumber || 24) + 1, code: `+ // Fix: ${result.suggestedFix || 'Wrap state mutation in transaction/lock'}` },
    ],
  };
}
