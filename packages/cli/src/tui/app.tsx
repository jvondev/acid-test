import React, { useState, useEffect, useCallback } from 'react';
import { Box, useInput, useApp, useStdout } from 'ink';
import type { InvariantResult, HealthGrade } from '@acidtest/core';
import { TestRunner, ProjectDetector } from '@acidtest/core';
import { createBillingSuite } from '@acidtest/billing';
import { createDbSuite } from '@acidtest/db';
import { createAuthSuite } from '@acidtest/auth';
import { createQueueSuite } from '@acidtest/queue';
import { createWebhookSuite } from '@acidtest/webhook';
import { createAiSuite } from '@acidtest/ai';
import { createEmailSuite } from '@acidtest/email';
import { createStorageSuite } from '@acidtest/storage';

import type { TuiTab } from './types.js';
import { TuiHeader } from './header.js';
import { SparklineChart } from './sparkline-chart.js';
import { InvariantsTable } from './invariants-table.js';
import { InspectorDeck } from './inspector-deck.js';
import { TuiFooter } from './footer.js';

interface TuiAppProps {
  initialUrl?: string;
  autoRun?: boolean;
}

const TAB_INDEX_MAP: Record<string, TuiTab> = {
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

export const TuiApp: React.FC<TuiAppProps> = ({ initialUrl, autoRun = true }) => {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const columns = stdout?.columns || 110;

  const [currentTab, setCurrentTab] = useState<TuiTab>('overview');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTestName, setActiveTestName] = useState<string | undefined>();
  const [allResults, setAllResults] = useState<InvariantResult[]>([]);
  const [healthScore, setHealthScore] = useState(100);
  const [healthGrade, setHealthGrade] = useState<HealthGrade>('A+');
  const [totalRiskUsd, setTotalRiskUsd] = useState(0);
  const [latencies, setLatencies] = useState<number[]>([14, 18, 12, 24, 20, 15, 9, 7, 5]);
  const [targetUrl, setTargetUrl] = useState(initialUrl || 'http://localhost:3000');
  const [targetLatencyMs, setTargetLatencyMs] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Press [A] to trigger full audit');

  const runAllSuites = useCallback(async () => {
    setIsRunning(true);
    setStatusMessage('Probing project topology & dev servers...');

    const discovery = await ProjectDetector.discover(process.cwd());
    if (discovery.liveServer) {
      setTargetUrl(discovery.liveServer.url);
      setTargetLatencyMs(discovery.liveServer.latencyMs);
    }

    const suites = [
      createBillingSuite(),
      createDbSuite(),
      createAuthSuite(),
      createQueueSuite(),
      createWebhookSuite(),
      createAiSuite(),
      createEmailSuite(),
      createStorageSuite(),
    ];

    const accumulatedResults: InvariantResult[] = [];
    const newLatencies: number[] = [];
    let totalFailed = 0;
    let accumulatedRisk = 0;

    for (const suite of suites) {
      setActiveTestName(suite.name);
      const report = await TestRunner.runSuite(suite, {
        targetUrl,
        concurrency: 10,
        jitterMs: 5,
      });

      accumulatedResults.push(...report.results);
      totalFailed += report.invariantsFailed;
      accumulatedRisk += report.totalRiskUsd;
      newLatencies.push(...report.results.map((r) => r.durationMs));

      setAllResults([...accumulatedResults]);
      setLatencies([...newLatencies]);
      setTotalRiskUsd(accumulatedRisk);
    }

    const score = Math.max(10, Math.round(100 - (totalFailed / Math.max(1, accumulatedResults.length)) * 100));
    const grade: HealthGrade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'CRITICAL';

    setHealthScore(score);
    setHealthGrade(grade);
    setIsRunning(false);
    setActiveTestName(undefined);
    setStatusMessage(`Audit complete. ${accumulatedResults.length - totalFailed}/${accumulatedResults.length} passed.`);
  }, [targetUrl]);

  useEffect(() => {
    if (autoRun) runAllSuites();
  }, [autoRun, runAllSuites]);

  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c')) {
      exit();
      return;
    }
    if (TAB_INDEX_MAP[input]) {
      setCurrentTab(TAB_INDEX_MAP[input]);
      setSelectedIndex(0);
      return;
    }
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(Math.max(0, allResults.length - 1), prev + 1));
    }
    if (input.toLowerCase() === 'a' && !isRunning) {
      runAllSuites();
    }
  });

  const filteredResults = currentTab === 'overview'
    ? allResults
    : allResults.filter((r) => r.category.toLowerCase().includes(currentTab));

  const selectedResult = filteredResults[selectedIndex] || filteredResults[0];

  const leftWidth = Math.max(38, Math.min(48, Math.floor(columns * 0.42)));
  const rightWidth = Math.max(48, columns - leftWidth - 4);

  return (
    <Box flexDirection="column" paddingX={1} width={columns}>
      <TuiHeader
        currentTab={currentTab}
        healthScore={healthScore}
        healthGrade={healthGrade}
        totalRiskUsd={totalRiskUsd}
        targetUrl={targetUrl}
        targetLatencyMs={targetLatencyMs}
        columns={columns}
      />

      <Box flexDirection="row" marginY={0}>
        <SparklineChart latencies={latencies} concurrency={10} width={leftWidth} />
        <InvariantsTable
          results={filteredResults}
          selectedIndex={selectedIndex}
          isRunning={isRunning}
          activeTestName={activeTestName}
          width={rightWidth}
        />
      </Box>

      <InspectorDeck selectedResult={selectedResult} />
      <TuiFooter statusMessage={statusMessage} isRunning={isRunning} />
    </Box>
  );
};
