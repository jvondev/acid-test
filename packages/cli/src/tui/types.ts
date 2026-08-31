import type { AuditReport, InvariantResult, HealthGrade, Severity, InvariantStatus } from '@acid-test/core';
export type { AuditReport, InvariantResult, HealthGrade, Severity, InvariantStatus };

export type TuiStage = 'hub' | 'detail';
export type TuiTab = 'overview' | 'billing' | 'db' | 'auth' | 'queue' | 'webhook' | 'ai' | 'email' | 'storage';
export type ActiveModal = 'none' | 'help' | 'chaos' | 'filter' | 'executive';

export interface ChaosConfig {
  concurrency: number;
  jitterMs: number;
  targetMode: 'live' | 'vulnerable' | 'hardened';
}

export interface FilterState {
  searchQuery: string;
  statusFilter?: InvariantStatus;
  severityFilter?: Severity;
}

export interface TuiState {
  stage: TuiStage;
  activeModal: ActiveModal;
  currentTab: TuiTab;
  selectedIndex: number;
  isRunning: boolean;
  activeTestName?: string;
  allResults: InvariantResult[];
  healthScore: number;
  healthGrade: HealthGrade;
  totalRiskUsd: number;
  monthlyLossUsd: number;
  compliancePenaltyUsd: number;
  latencies: number[];
  targetUrl: string;
  targetLatencyMs: number;
  statusMessage?: string;
  toastMessage?: string;
  chaosConfig: ChaosConfig;
  filterState: FilterState;
}
