/**
 * Footer component - displays keybinding hints
 */
import React from 'react';
import { Box, Text } from 'ink';
import { horizontalLine, styled } from '../../utils/colors.js';
import { getTerminalSize } from '../../utils/terminal.js';

export interface KeyHint {
  key: string;
  action: string;
}

export interface FooterProps {
  hints?: KeyHint[];
}

const defaultHints: KeyHint[] = [
  { key: 'j/k', action: 'navigate' },
  { key: 'Enter', action: 'select' },
  { key: 'b', action: 'back' },
  { key: '?', action: 'help' },
  { key: 'q', action: 'quit' },
];

export function Footer({ hints = defaultHints }: FooterProps) {
  const { width } = getTerminalSize();

  return (
    <Box flexDirection="column" width={width}>
      <Text>{horizontalLine(width)}</Text>
      <Box paddingX={1} gap={2}>
        {hints.map((hint, i) => (
          <Text key={i}>{styled.hint(hint.key, hint.action)}</Text>
        ))}
      </Box>
    </Box>
  );
}
