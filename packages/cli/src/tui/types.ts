import type { AuditReport, InvariantResult, HealthGrade } from '@acidtest/core';

export type TuiTab = 'overview' | 'billing' | 'db' | 'auth' | 'queue' | 'webhook' | 'ai' | 'email' | 'storage';

export interface TuiState {
  currentTab: TuiTab;
  selectedIndex: number;
  isRunning: boolean;
  activeTestName?: string;
  reports: Map<string, AuditReport>;
  allResults: InvariantResult[];
  healthScore: number;
  healthGrade: HealthGrade;
  totalRiskUsd: number;
  latencies: number[];
  targetUrl: string;
  targetLatencyMs: number;
  statusMessage?: string;
}
