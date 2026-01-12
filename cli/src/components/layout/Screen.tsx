/**
 * Screen component - full-screen layout wrapper
 */
import React, { type ReactNode } from 'react';
import { Box } from 'ink';
import { Header, type HeaderProps } from './Header.js';
import { Footer, type FooterProps, type KeyHint } from './Footer.js';
import { getTerminalSize, getContentHeight } from '../../utils/terminal.js';

export interface ScreenProps extends HeaderProps {
  children: ReactNode;
  hints?: KeyHint[];
  hideFooter?: boolean;
}

export function Screen({ title, subtitle, children, hints, hideFooter }: ScreenProps) {
  const { width, height } = getTerminalSize();
  const contentHeight = getContentHeight(2, hideFooter ? 0 : 2);

  return (
    <Box flexDirection="column" width={width} height={height}>
      <Header title={title} subtitle={subtitle} />
      <Box flexDirection="column" height={contentHeight} overflow="hidden">
        {children}
      </Box>
      {!hideFooter && <Footer hints={hints} />}
    </Box>
  );
}

export { type KeyHint } from './Footer.js';
