import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, useInput, useApp, Text } from 'ink';
import type { InvariantResult, HealthGrade } from '@acid-test/core';
import { TestRunner, ProjectDetector, FinancialRiskCalculator, SandboxServer } from '@acid-test/core';

import type { TuiTab, ActiveModal, ChaosConfig, FilterState } from './types.js';
import { HeaderRibbon } from './components/header.js';
import { FooterDock } from './components/footer.js';
import { ToastBanner } from './components/toast.js';

import { InvariantsExplorer } from './views/invariants-explorer.js';
import { CodeInspector } from './views/code-inspector.js';
import { ExecutiveScorecard } from './views/executive-scorecard.js';
import { ChaosLabView } from './views/chaos-lab.js';
import { HelpView } from './views/help-view.js';
import { FilterView } from './views/filter-view.js';

import { exportPromptToFile } from './export-prompt.js';
import { exportHtmlAuditReport } from './export-html.js';
import { getAllDomainSuites } from './suite-factory.js';
import { MouseTracker } from './mouse-tracker.js';
import { getGradientAnsi, BRAND_COLORS } from './theme.js';

interface TuiAppProps {
  initialUrl?: string;
  autoRun?: boolean;
}

const TAB_MAP: Record<string, TuiTab> = {
  '1': 'overview',
  '2': 'billing',
  '3': 'db',
  '4': 'auth',
  '5': 'queue',
  '6': 'webhook',
  '7': 'ai',
  '8': 'email',
  '9': 'storage',
};

const TAB_LIST: TuiTab[] = ['overview', 'billing', 'db', 'auth', 'queue', 'webhook', 'ai', 'email', 'storage'];

export const TuiApp: React.FC<TuiAppProps> = ({ initialUrl, autoRun = true }) => {
  const { exit } = useApp();

  // Dynamic Terminal Dimensions
  const [dimensions, setDimensions] = useState({
    columns: process.stdout.columns || 105,
    rows: process.stdout.rows || 30,
  });

  useEffect(() => {
    const onResize = () => {
      setDimensions({
        columns: process.stdout.columns || 105,
        rows: process.stdout.rows || 30,
      });
    };
    process.stdout.on('resize', onResize);
    return () => {
      process.stdout.off('resize', onResize);
    };
  }, []);

  const columns = Math.max(60, dimensions.columns);

  // 30 FPS Ambient Fluid Caustics Time Clock
  const [timeVal, setTimeVal] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeVal((t) => t + 0.05);
    }, 33);
    return () => clearInterval(timer);
  }, []);

  const [currentTab, setCurrentTab] = useState<TuiTab>('overview');
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTestName, setActiveTestName] = useState<string | undefined>();
  const [allResults, setAllResults] = useState<InvariantResult[]>([]);
  const [healthScore, setHealthScore] = useState(100);
  const [healthGrade, setHealthGrade] = useState<HealthGrade>('A+');
  const [totalRiskUsd, setTotalRiskUsd] = useState(0);
  const [monthlyLossUsd, setMonthlyLossUsd] = useState(0);
  const [compliancePenaltyUsd, setCompliancePenaltyUsd] = useState(0);
  const [targetUrl, setTargetUrl] = useState(initialUrl || 'http://localhost:3000');
  const [targetLatencyMs, setTargetLatencyMs] = useState(0);
  const [isSandbox, setIsSandbox] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Press [Space] to run audit');
  const [toastMessage, setToastMessage] = useState<string | undefined>();
  const [chaosConfig, setChaosConfig] = useState<ChaosConfig>({ concurrency: 10, jitterMs: 5, targetMode: 'live' });
  const [filterState, setFilterState] = useState<FilterState>({ searchQuery: '' });

  const sandboxServerRef = useRef<SandboxServer | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(undefined), 3500);
  };

  const runAllSuites = useCallback(async () => {
    setIsRunning(true);
    setStatusMessage('Injecting 8-domain concurrency torrent...');

    let activeUrl = targetUrl;

    // 1. Probe for live app (3000, 3001, 5173, etc.)
    const disc = await ProjectDetector.discover(process.cwd());
    if (disc.liveServer) {
      activeUrl = disc.liveServer.url;
      setTargetUrl(disc.liveServer.url);
      setTargetLatencyMs(disc.liveServer.latencyMs);
      setIsSandbox(false);
    } else {
      // 2. Auto-spawn in-memory Ephemeral Sandbox on port 4455
      if (!sandboxServerRef.current) {
        try {
          const s = new SandboxServer({ port: 4455, mode: 'vulnerable' });
          const port = await s.start();
          sandboxServerRef.current = s;
          activeUrl = `http://localhost:${port}`;
        } catch {
          activeUrl = 'http://localhost:4455';
        }
      } else {
        activeUrl = `http://localhost:${sandboxServerRef.current.getPort()}`;
      }
      setTargetUrl(activeUrl);
      setTargetLatencyMs(1);
      setIsSandbox(true);
    }

    const suites = getAllDomainSuites();
    const accumulated: InvariantResult[] = [];

    for (const suite of suites) {
      setActiveTestName(suite.name);
      const report = await TestRunner.runSuite(suite, {
        targetUrl: activeUrl,
        concurrency: chaosConfig.concurrency,
        jitterMs: chaosConfig.jitterMs,
      });
      accumulated.push(...report.results);
    }

    const risk = FinancialRiskCalculator.calculate(accumulated);
    setAllResults(accumulated);
    setHealthScore(risk.healthScore);
    setHealthGrade(risk.healthGrade);
    setTotalRiskUsd(risk.totalRiskExposureUsd);
    setMonthlyLossUsd(risk.estimatedMonthlyLossUsd);
    setCompliancePenaltyUsd(risk.compliancePenaltyUsd);
    setIsRunning(false);
    setActiveTestName(undefined);

    const passed = accumulated.filter((r) => r.status === 'PASS').length;
    setStatusMessage(`Audit complete: ${passed}/${accumulated.length} invariants verified.`);
  }, [targetUrl, chaosConfig]);

  useEffect(() => {
    if (autoRun) runAllSuites();
    return () => {
      sandboxServerRef.current?.stop();
    };
  }, [autoRun, runAllSuites]);

  // Tab counts
  const counts: Record<TuiTab, number> = {
    overview: allResults.length,
    billing: allResults.filter((r) => r.category.toLowerCase().includes('billing')).length,
    db: allResults.filter((r) => r.category.toLowerCase().includes('db')).length,
    auth: allResults.filter((r) => r.category.toLowerCase().includes('auth')).length,
    queue: allResults.filter((r) => r.category.toLowerCase().includes('queue')).length,
    webhook: allResults.filter((r) => r.category.toLowerCase().includes('webhook')).length,
    ai: allResults.filter((r) => r.category.toLowerCase().includes('ai')).length,
    email: allResults.filter((r) => r.category.toLowerCase().includes('email')).length,
    storage: allResults.filter((r) => r.category.toLowerCase().includes('storage')).length,
  };

  const rawFiltered = allResults.filter((r) => {
    const tabMatch = currentTab === 'overview' || r.category.toLowerCase().includes(currentTab);
    const statusMatch = !filterState.statusFilter || r.status === filterState.statusFilter;
    const sevMatch = !filterState.severityFilter || r.severity === filterState.severityFilter;
    return tabMatch && statusMatch && sevMatch;
  });

  // Failures First
  const failures = rawFiltered.filter((r) => r.status === 'FAIL');
  const passes = rawFiltered.filter((r) => r.status !== 'FAIL');
  const filteredResults = [...failures, ...passes];

  const selectedResult = filteredResults[selectedIndex] || filteredResults[0];

  const handleAutoFix = () => {
    if (!selectedResult) return;
    const ok = exportPromptToFile(selectedResult);
    showToast(ok ? 'Prompt exported to .acid-test/remediation.prompt.md' : 'Failed to export prompt');
  };

  const handleExportHtml = () => {
    const file = exportHtmlAuditReport(allResults, targetUrl);
    showToast(file ? `HTML Report generated at ${file}` : 'Failed to generate report');
  };

  // Keyboard & Mouse interaction handler
  useInput((input, key) => {
    const mouse = MouseTracker.parseMouseEvent(input);
    if (mouse) {
      if (mouse.button === 'scrollUp') {
        setSelectedIndex((p) => Math.max(0, p - 1));
        return;
      }
      if (mouse.button === 'scrollDown') {
        setSelectedIndex((p) => Math.min(Math.max(0, filteredResults.length - 1), p + 1));
        return;
      }
      if (mouse.button === 'left') {
        if (mouse.y === 2 || mouse.y === 3) {
          const tabIndex = Math.min(TAB_LIST.length - 1, Math.floor(mouse.x / 11));
          if (TAB_LIST[tabIndex]) {
            setCurrentTab(TAB_LIST[tabIndex]);
            setSelectedIndex(0);
            return;
          }
        }
        const leftWidth = Math.max(26, Math.floor(columns * 0.35));
        if (mouse.x <= leftWidth && mouse.y >= 5 && mouse.y <= 19) {
          const clickedIndex = mouse.y - 5;
          if (clickedIndex < filteredResults.length) {
            setSelectedIndex(clickedIndex);
            return;
          }
        }
        if (mouse.x > leftWidth && mouse.y >= 16) {
          handleAutoFix();
          return;
        }
      }
      return;
    }

    if (input === 'q' || (key.ctrl && input === 'c')) {
      sandboxServerRef.current?.stop();
      exit();
      return;
    }
    if (key.escape) {
      setActiveModal('none');
      return;
    }

    if (activeModal !== 'none') {
      if (activeModal === 'chaos') {
        if (input === '1') setChaosConfig((c) => ({ ...c, concurrency: 10 }));
        if (input === '2') setChaosConfig((c) => ({ ...c, concurrency: 25 }));
        if (input === '3') setChaosConfig((c) => ({ ...c, concurrency: 50 }));
        if (input === '4') setChaosConfig((c) => ({ ...c, concurrency: 100 }));
        if (input === '5') setChaosConfig((c) => ({ ...c, jitterMs: 0 }));
        if (input === '6') setChaosConfig((c) => ({ ...c, jitterMs: 5 }));
        if (input === '7') setChaosConfig((c) => ({ ...c, jitterMs: 25 }));
        if (input === '8') setChaosConfig((c) => ({ ...c, jitterMs: 100 }));
        if (input === ' ' && !isRunning) runAllSuites();
        return;
      }
      if (activeModal === 'filter') {
        if (input === '1') setFilterState((f) => ({ ...f, severityFilter: undefined }));
        if (input === '2') setFilterState((f) => ({ ...f, severityFilter: 'CRITICAL' }));
        if (input === '3') setFilterState((f) => ({ ...f, severityFilter: 'HIGH' }));
        if (input === '4') setFilterState((f) => ({ ...f, severityFilter: 'MEDIUM' }));
        if (input === '5') setFilterState((f) => ({ ...f, statusFilter: undefined }));
        if (input === '6') setFilterState((f) => ({ ...f, statusFilter: 'FAIL' }));
        if (input === '7') setFilterState((f) => ({ ...f, statusFilter: 'PASS' }));
        return;
      }
      return;
    }

    if (TAB_MAP[input]) {
      setCurrentTab(TAB_MAP[input]);
      setSelectedIndex(0);
      return;
    }

    if (key.upArrow || input === 'k') {
      setSelectedIndex((p) => Math.max(0, p - 1));
      return;
    }
    if (key.downArrow || input === 'j') {
      setSelectedIndex((p) => Math.min(Math.max(0, filteredResults.length - 1), p + 1));
      return;
    }

    if (input === 'f' || input === 'F' || key.return) {
      handleAutoFix();
      return;
    }

    if (input === 'r' || input === 'R') {
      showToast(`Replaying concurrency burst on [${selectedResult?.testId}]...`);
      return;
    }

    if (input === 'v' || input === 'V') {
      setActiveModal('executive');
      return;
    }

    if (input === 'c' || input === 'C') {
      setActiveModal('chaos');
      return;
    }

    if (input === '/') {
      setActiveModal('filter');
      return;
    }

    if (input === '?' || input === 'h') {
      setActiveModal('help');
      return;
    }

    if (input === 'H') {
      handleExportHtml();
      return;
    }

    if ((input === 'a' || input === 'A' || input === ' ') && !isRunning) {
      runAllSuites();
      return;
    }
  });

  const leftWidth = Math.max(26, Math.floor(columns * 0.35));
  const rightWidth = Math.max(30, columns - leftWidth);

  return (
    <Box flexDirection="column" width={columns}>
      <HeaderRibbon
        currentTab={currentTab}
        targetUrl={targetUrl}
        targetLatencyMs={targetLatencyMs}
        isSandbox={isSandbox}
        healthScore={healthScore}
        healthGrade={healthGrade}
        totalRiskUsd={totalRiskUsd}
        counts={counts}
        columns={columns}
        timeVal={timeVal}
      />

      <ToastBanner message={toastMessage} columns={columns} />

      {activeModal === 'help' ? (
        <HelpView columns={columns} />
      ) : activeModal === 'chaos' ? (
        <ChaosLabView config={chaosConfig} isRunning={isRunning} columns={columns} />
      ) : activeModal === 'filter' ? (
        <FilterView filter={filterState} columns={columns} />
      ) : activeModal === 'executive' ? (
        <ExecutiveScorecard
          healthScore={healthScore}
          healthGrade={healthGrade}
          totalRiskUsd={totalRiskUsd}
          monthlyLossUsd={monthlyLossUsd}
          compliancePenaltyUsd={compliancePenaltyUsd}
          results={allResults}
          columns={columns}
        />
      ) : isRunning ? (
        /* Live Concurrency Torrent View while tests run */
        <Box flexDirection="column" width={columns} paddingY={1} paddingX={1}>
          <Text bold color="green">
            ⚡ INJECTING 8-DOMAIN ADVERSARIAL CONCURRENCY TORRENT...
          </Text>
          <Text color="gray">
            Auditing {activeTestName || 'distributed endpoints'} under 5ms microsecond jitter...
          </Text>
          <Box marginTop={1}>
            <Text color="green">
              {Array.from({ length: Math.min(columns - 4, 60) })
                .map((_, i) => {
                  const t = (i / 60) + Math.sin(timeVal * 4 + i) * 0.1;
                  return `${getGradientAnsi(t)}█\x1b[0m`;
                })
                .join('')}
            </Text>
          </Box>
        </Box>
      ) : (
        /* Permanent Split-Screen IDE Layout */
        <Box flexDirection="row" width={columns} marginTop={0}>
          <InvariantsExplorer
            results={filteredResults}
            selectedIndex={selectedIndex}
            isRunning={isRunning}
            activeTestName={activeTestName}
            width={leftWidth}
          />
          <CodeInspector selectedResult={selectedResult} width={rightWidth} />
        </Box>
      )}

      <FooterDock
        isRunning={isRunning}
        activeTestName={activeTestName}
        statusMessage={statusMessage}
        selectedSummary={selectedResult?.summary}
        columns={columns}
      />
    </Box>
  );
};
