import React from 'react';
import { Box, Text } from 'ink';
import { THEME, safeTruncate } from '../theme.js';

interface ToastProps {
  message?: string;
  columns: number;
}

export const ToastBanner: React.FC<ToastProps> = ({ message, columns }) => {
  if (!message) return null;

  return (
    <Box
      width={columns}
      justifyContent="center"
      backgroundColor="green"
      paddingX={1}
      flexWrap="nowrap"
    >
      <Text color="black" bold>
        {THEME.symbols.pass} {safeTruncate(message, columns - 6)}
      </Text>
    </Box>
  );
};
