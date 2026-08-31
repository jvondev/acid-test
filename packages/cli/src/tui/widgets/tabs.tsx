import React from 'react';
import { Box, Text } from 'ink';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  num: string;
  count?: number;
}

export interface TabsProps<T extends string = string> {
  items: TabItem<T>[];
  activeId: T;
  columns: number;
}

/**
 * Ratatui-inspired Tabs navigation bar with active pill highlights.
 */
export const Tabs = <T extends string>({ items, activeId, columns }: TabsProps<T>) => {
  return (
    <Box width={columns} flexWrap="nowrap">
      {items.map((tab, idx) => {
        const isActive = tab.id === activeId;
        const countDisplay = tab.count !== undefined ? `: ${tab.count}` : '';
        return (
          <React.Fragment key={tab.id}>
            {idx > 0 && <Text color="gray"> </Text>}
            <Text
              color={isActive ? 'black' : 'gray'}
              backgroundColor={isActive ? 'green' : undefined}
              bold={isActive}
            >
              {` [${tab.num}] ${tab.label}${countDisplay} `}
            </Text>
          </React.Fragment>
        );
      })}
    </Box>
  );
};
