import React from 'react';
import { Box, Text } from 'ink';
import type { InvariantResult } from '@acidtest/core';

interface InspectorDeckProps {
  selectedResult?: InvariantResult;
}

export const InspectorDeck: React.FC<InspectorDeckProps> = ({ selectedResult }) => {
  if (!selectedResult) {
    return (
      <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1}>
        <Text bold color="cyan">INSPECTOR & AI REMEDIATION DECK</Text>
        <Text color="gray">Select an invariant above using ↑/↓ arrow keys to inspect traces, root causes, and AI fix prompts.</Text>
      </Box>
    );
  }

  const isFailed = selectedResult.status === 'FAIL';
  const statusColor = isFailed ? 'red' : 'green';

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={isFailed ? 'red' : 'gray'} paddingX={1}>
      <Box justifyContent="space-between" flexWrap="nowrap">
        <Text bold color={statusColor}>
          [{selectedResult.testId}] {selectedResult.title}
        </Text>
        <Text color="gray">
          Severity: <Text color={selectedResult.severity === 'CRITICAL' ? 'red' : 'yellow'} bold>{selectedResult.severity}</Text>
        </Text>
      </Box>

      <Box marginTop={0}>
        <Text color="white">{selectedResult.summary}</Text>
      </Box>

      {selectedResult.failingFile && (
        <Box gap={1} marginTop={0} flexWrap="nowrap">
          <Text color="gray">Source Location:</Text>
          <Text color="cyan" bold>{selectedResult.failingFile}:{selectedResult.lineNumber || 1}</Text>
        </Box>
      )}

      {selectedResult.rootCause && (
        <Box marginTop={0}>
          <Text color="gray">Root Cause: </Text>
          <Text color="yellow">{selectedResult.rootCause}</Text>
        </Box>
      )}

      {selectedResult.suggestedFix && (
        <Box marginTop={0}>
          <Text color="gray">Remediation: </Text>
          <Text color="green">{selectedResult.suggestedFix}</Text>
        </Box>
      )}

      {selectedResult.curlReproduction && (
        <Box marginTop={0} flexDirection="column">
          <Text color="gray">cURL Reproduction:</Text>
          <Text color="magenta">{selectedResult.curlReproduction}</Text>
        </Box>
      )}
    </Box>
  );
};
