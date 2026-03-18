/**
 * Header component - displays title and breadcrumb
 */
import React from 'react';
import { Box, Text } from 'ink';
import { useNavigation } from '../../store/navigation.js';
import { useIdentity } from '../../store/identity.js';
import { styled, horizontalLine } from '../../utils/colors.js';
import { getTerminalSize } from '../../utils/terminal.js';

export interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { stack } = useNavigation();
  const { identity } = useIdentity();
  const { width } = getTerminalSize();

  // Build breadcrumb
  const breadcrumb = stack.length > 0 ? '\u2190 Back (b)' : '';

  // Identity indicator
  const identityText = identity
    ? styled.username(identity.username || identity.identityId.slice(0, 8))
    : '';

  return (
    <Box flexDirection="column" width={width}>
      <Box justifyContent="space-between" paddingX={1}>
        <Box>
          <Text>{styled.header(title)}</Text>
          {subtitle && (
            <Text> {styled.subheader(subtitle)}</Text>
          )}
        </Box>
        <Box>
          {breadcrumb && <Text dimColor>{breadcrumb}  </Text>}
          {identityText && <Text>{identityText}</Text>}
        </Box>
      </Box>
      <Text>{horizontalLine(width)}</Text>
    </Box>
  );
}
