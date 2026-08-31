export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type InvariantStatus = 'PASS' | 'FAIL' | 'SKIP' | 'WARN';

export type HealthGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' | 'CRITICAL';

export interface InvariantResult {
  testId: string;
  testName: string;
  category: string;
  provider: string;
  severity: Severity;
  status: InvariantStatus;
  durationMs: number;
  title: string;
  summary: string;
  details?: string;
  curlReproduction?: string;
  failingFile?: string;
  lineNumber?: number;
  rootCause?: string;
  suggestedFix?: string;
  aiPrompt?: string;
  metrics?: Record<string, unknown>;
  data?: unknown;
}

export interface ExecutionContext {
  targetUrl?: string;
  dbUrl?: string;
  redisUrl?: string;
  secretKey?: string;
  webhookSecret?: string;
  concurrency?: number;
  jitterMs?: number;
  timeoutMs?: number;
  dryRun?: boolean;
  gmv?: number;
  ticketSize?: number;
  metadata?: Record<string, unknown>;
  logger?: (msg: string) => void;
  onProgress?: (info: { completed: number; total: number; currentTest: string }) => void;
}

export interface InvariantTest {
  id: string;
  name: string;
  category: string;
  provider: string;
  severity: Severity;
  description: string;
  run(context: ExecutionContext): Promise<InvariantResult>;
}

export interface InvariantSuite {
  name: string;
  category: string;
  provider: string;
  tests: InvariantTest[];
}

export interface AiRemediationIssue {
  id: string;
  severity: Severity;
  title: string;
  failingFile?: string;
  lineNumber?: number;
  reproductionCommand?: string;
  rootCause?: string;
  suggestedFix?: string;
  aiPrompt?: string;
}

export interface AuditReport {
  version: string;
  id: string;
  timestamp: string;
  target: string;
  module: string;
  provider: string;
  score: 'CLEAN' | 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' | 'CRITICAL';
  healthScore: number;
  healthGrade: HealthGrade;
  financialRiskUsdMonthly: number;
  complianceRiskUsd: number;
  totalRiskUsd: number;
  executiveSummary: string;
  invariantsTested: number;
  invariantsPassed: number;
  invariantsFailed: number;
  invariantsSkipped: number;
  durationMs: number;
  results: InvariantResult[];
  remediations: AiRemediationIssue[];
}

export interface ProbeResult {
  reachable: boolean;
  latencyMs: number;
  statusCode?: number;
  serverSoftware?: string;
  corsHeaders?: Record<string, string>;
  error?: string;
}
