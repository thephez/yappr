/**
 * Empty component - empty state display
 */
import React from 'react';
import { Box, Text } from 'ink';

export interface EmptyProps {
  message?: string;
  hint?: string;
}

export function Empty({ message = 'Nothing here', hint }: EmptyProps) {
  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Text dimColor>{message}</Text>
      {hint && <Text dimColor color="gray">{hint}</Text>}
    </Box>
  );
}
