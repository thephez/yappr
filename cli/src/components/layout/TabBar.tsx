/**
 * TabBar component - horizontal tab navigation
 */
import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../../utils/colors.js';

export interface Tab {
  label: string;
  key?: string;
}

export interface TabBarProps {
  tabs: Tab[];
  activeIndex: number;
  onSelect?: (index: number) => void;
}

export function TabBar({ tabs, activeIndex }: TabBarProps) {
  return (
    <Box paddingX={1} gap={2} marginBottom={1}>
      {tabs.map((tab, index) => {
        const isActive = index === activeIndex;
        return (
          <Text
            key={index}
            bold={isActive}
            color={isActive ? 'cyan' : undefined}
            dimColor={!isActive}
          >
            {tab.key && <Text dimColor>[{tab.key}] </Text>}
            {tab.label}
            {isActive && ' \u2022'}
          </Text>
        );
      })}
    </Box>
  );
}
