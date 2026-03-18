/**
 * Help screen - keyboard shortcuts and info
 */
import React from 'react';
import { Box, Text } from 'ink';
import { Screen } from '../components/layout/index.js';
import { styled, horizontalLine } from '../utils/colors.js';
import { getContentWidth } from '../utils/terminal.js';

export function Help() {
  const width = getContentWidth();

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="cyan">{title}</Text>
      {children}
    </Box>
  );

  const Key = ({ k, action }: { k: string; action: string }) => (
    <Box>
      <Box width={12}>
        <Text bold>{k}</Text>
      </Box>
      <Text dimColor>{action}</Text>
    </Box>
  );

  return (
    <Screen title="Help" subtitle="Keyboard Shortcuts" hints={[{ key: 'Esc', action: 'close' }]}>
      <Box flexDirection="column" paddingX={1}>
        <Section title="Navigation">
          <Key k="j / \u2193" action="Move down" />
          <Key k="k / \u2191" action="Move up" />
          <Key k="Enter" action="Select / Open" />
          <Key k="b / Esc" action="Go back" />
          <Key k="g" action="Go to timeline" />
        </Section>

        <Section title="Global">
          <Key k="/" action="Open search" />
          <Key k="i" action="Open settings (identity)" />
          <Key k="?" action="Show this help" />
          <Key k="q" action="Quit" />
          <Key k="r" action="Refresh current view" />
        </Section>

        <Section title="Timeline">
          <Key k="1" action="Global feed" />
          <Key k="2" action="Following feed (requires identity)" />
        </Section>

        <Section title="Profile">
          <Key k="1" action="User's posts" />
          <Key k="2" action="User's likes" />
          <Key k="f" action="View followers" />
          <Key k="g" action="View following" />
        </Section>

        <Section title="Post Detail">
          <Key k="a" action="View author profile" />
        </Section>

        <Text>{horizontalLine(width - 2)}</Text>

        <Box marginTop={1} flexDirection="column">
          <Text bold>About Yappr CLI</Text>
          <Text dimColor>
            A read-only terminal interface for Yappr, the decentralized
          </Text>
          <Text dimColor>
            social media platform on Dash Platform.
          </Text>
          <Text> </Text>
          <Text dimColor>
            Set your identity (press i) to see personalized content like
          </Text>
          <Text dimColor>
            your following feed and interaction status.
          </Text>
          <Text> </Text>
          <Text dimColor>Version 0.1.0</Text>
        </Box>
      </Box>
    </Screen>
  );
}
