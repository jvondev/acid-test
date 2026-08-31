import React from 'react';
import { Text } from 'ink';

export interface SparklineProps {
  data: number[];
  max?: number;
  color?: string;
}

const TICKS = [' ', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

/**
 * Ratatui-inspired Sparkline Widget using sub-block characters.
 */
export const Sparkline: React.FC<SparklineProps> = ({ data, max, color = 'cyan' }) => {
  if (data.length === 0) return <Text color="gray">──────</Text>;

  const peak = max || Math.max(...data, 1);
  const chars = data.map((val) => {
    const ratio = Math.max(0, Math.min(1, val / peak));
    const idx = Math.min(Math.floor(ratio * TICKS.length), TICKS.length - 1);
    return TICKS[idx];
  });

  return <Text color={color}>{chars.join('')}</Text>;
};
