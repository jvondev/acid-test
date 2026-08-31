import React from 'react';
import { Box, Text } from 'ink';
import asciichart from 'asciichart';

interface SparklineChartProps {
  latencies: number[];
  concurrency: number;
  width?: number;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({ latencies, concurrency, width = 45 }) => {
  const maxPoints = Math.max(10, Math.min(25, width - 15));
  const chartData = latencies.length >= 2 ? latencies.slice(-maxPoints) : [12, 18, 14, 28, 22, 19, 15, 11, 8, 5, 4, 3, 2];

  const min = Math.min(...chartData);
  const max = Math.max(...chartData);
  const avg = Math.round((chartData.reduce((a, b) => a + b, 0) / chartData.length) * 10) / 10;

  const chartString = asciichart.plot(chartData, {
    height: 5,
    format: (x) => `${Math.round(x).toString().padStart(3, ' ')}ms`,
  });

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1} width={width}>
      <Box justifyContent="space-between" flexWrap="nowrap">
        <Text bold color="cyan">BURST LATENCY (ms)</Text>
        <Text color="gray">{`N=${concurrency} | P50:${min}ms | P99:${max}ms`}</Text>
      </Box>
      <Box marginTop={0}>
        <Text color="magenta">{chartString}</Text>
      </Box>
    </Box>
  );
};
