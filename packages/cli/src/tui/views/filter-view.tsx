import React from 'react';
import { Box, Text } from 'ink';
import type { FilterState } from '../types.js';

interface FilterProps {
  filter: FilterState;
  columns: number;
}

export const FilterView: React.FC<FilterProps> = ({ filter, columns }) => {
  return (
    <Box flexDirection="column" width={columns} paddingX={1}>
      <Box marginTop={1} justifyContent="space-between" width={columns - 2} flexWrap="nowrap">
        <Text bold color="cyan">
          INVARIANT FILTER & SEVERITY SELECTOR
        </Text>
        <Text color="gray">Press [/] or [Esc] to apply & return</Text>
      </Box>

      <Box flexDirection="column" marginTop={1} width={columns - 2}>
        {/* Severity Filter */}
        <Box justifyContent="space-between" flexWrap="nowrap">
          <Text color="cyan" bold>Severity Filter:</Text>
          <Box gap={1} flexWrap="nowrap">
            {[
              { label: 'ALL', val: undefined },
              { label: 'CRITICAL', val: 'CRITICAL' },
              { label: 'HIGH', val: 'HIGH' },
              { label: 'MEDIUM', val: 'MEDIUM' },
            ].map((item) => {
              const active = filter.severityFilter === item.val;
              return (
                <Text
                  key={item.label}
                  color={active ? 'black' : 'gray'}
                  backgroundColor={active ? 'cyan' : undefined}
                  bold={active}
                >
                  {` ${item.label} `}
                </Text>
              );
            })}
          </Box>
        </Box>

        {/* Status Filter */}
        <Box justifyContent="space-between" marginTop={1} flexWrap="nowrap">
          <Text color="cyan" bold>Status Filter:</Text>
          <Box gap={1} flexWrap="nowrap">
            {[
              { label: 'ALL', val: undefined },
              { label: 'FAILURES ONLY', val: 'FAIL' },
              { label: 'PASSES ONLY', val: 'PASS' },
            ].map((item) => {
              const active = filter.statusFilter === item.val;
              return (
                <Text
                  key={item.label}
                  color={active ? 'black' : 'gray'}
                  backgroundColor={active ? (item.val === 'FAIL' ? 'red' : 'green') : undefined}
                  bold={active}
                >
                  {` ${item.label} `}
                </Text>
              );
            })}
          </Box>
        </Box>
      </Box>

      <Box marginTop={1} justifyContent="space-between" width={columns - 2} flexWrap="nowrap">
        <Text color="gray">
          Press <Text color="cyan" bold>[1-4]</Text> Severity Filter | <Text color="cyan" bold>[5-7]</Text> Status Filter
        </Text>
        <Text color="green" bold>
          {filter.severityFilter || filter.statusFilter ? 'Active Filter Applied' : 'Showing All Invariants'}
        </Text>
      </Box>
    </Box>
  );
};
