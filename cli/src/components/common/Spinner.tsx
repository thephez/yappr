/**
 * Spinner component - loading indicator
 */
import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { colors } from '../../utils/colors.js';

const frames = ['\u280b', '\u2819', '\u2839', '\u2838', '\u283c', '\u2834', '\u2826', '\u2827', '\u2807', '\u280f'];

export interface SpinnerProps {
  label?: string;
}

export function Spinner({ label = 'Loading...' }: SpinnerProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % frames.length);
    }, 80);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box paddingX={1}>
      <Text color="cyan">{frames[frame]} </Text>
      <Text dimColor>{label}</Text>
    </Box>
  );
}
