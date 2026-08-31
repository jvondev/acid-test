import React from 'react';
import { Box, Text } from 'ink';

export interface BlockProps {
  title?: string;
  badge?: string;
  badgeColor?: string;
  borderColor?: string;
  width?: number | string;
  paddingX?: number;
  paddingY?: number;
  flexDirection?: 'column' | 'row';
  children: React.ReactNode;
}

/**
 * Ratatui-inspired Block Container with rounded corners (╭─╮, ╰─╯) and title chips.
 */
export const Block: React.FC<BlockProps> = ({
  title,
  badge,
  badgeColor = 'green',
  borderColor = 'gray',
  width,
  paddingX = 1,
  paddingY = 0,
  flexDirection = 'column',
  children,
}) => {
  return (
    <Box
      flexDirection={flexDirection}
      width={width}
      borderStyle="round"
      borderColor={borderColor}
      paddingX={paddingX}
      paddingY={paddingY}
    >
      {title && (
        <Box justifyContent="space-between" marginBottom={0} flexWrap="nowrap">
          <Text bold color="white">
            {title}
          </Text>
          {badge && (
            <Text bold color={badgeColor}>
              [{badge}]
            </Text>
          )}
        </Box>
      )}
      {children}
    </Box>
  );
};
