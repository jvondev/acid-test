import React from 'react';
import { Text } from 'ink';

export interface GaugeProps {
  ratio: number; // 0.0 to 1.0
  width?: number;
  filledChar?: string;
  emptyChar?: string;
  color?: string;
}

/**
 * Ratatui-inspired Gauge Progress Bar.
 */
export const Gauge: React.FC<GaugeProps> = ({
  ratio,
  width = 10,
  filledChar = '█',
  emptyChar = '░',
  color = 'green',
}) => {
  const clamped = Math.max(0, Math.min(1, ratio));
  const filledCount = Math.round(clamped * width);
  const emptyCount = Math.max(0, width - filledCount);

  return (
    <Text color={color}>
      {filledChar.repeat(filledCount)}
      <Text color="gray">{emptyChar.repeat(emptyCount)}</Text>
    </Text>
  );
};
