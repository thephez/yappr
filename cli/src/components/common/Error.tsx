/**
 * Error component - error message display
 */
import React from 'react';
import { Box, Text } from 'ink';

export interface ErrorProps {
  message: string;
  details?: string;
}

export function Error({ message, details }: ErrorProps) {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text color="red">{'\u2717'} {message}</Text>
      {details && <Text dimColor>  {details}</Text>}
    </Box>
  );
}
