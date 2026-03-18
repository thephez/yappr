/**
 * Main App component - router and global keyboard handling
 */
import React, { useEffect } from 'react';
import { Box, useApp, useInput } from 'ink';
import { useNavigation, type ScreenType } from './store/navigation.js';
import { useIdentity } from './store/identity.js';

// Screens (will be implemented)
import { Timeline } from './screens/Timeline.js';
import { PostDetail } from './screens/PostDetail.js';
import { UserProfile } from './screens/UserProfile.js';
import { Search } from './screens/Search.js';
import { Settings } from './screens/Settings.js';
import { Followers } from './screens/Followers.js';
import { Hashtag } from './screens/Hashtag.js';
import { Help } from './screens/Help.js';

export interface AppProps {
  initialScreen?: ScreenType;
  initialParams?: Record<string, any>;
}

export function App({ initialScreen, initialParams }: AppProps) {
  const { exit } = useApp();
  const { current, push, pop, reset } = useNavigation();
  const { loadIdentity } = useIdentity();

  // Load identity on mount
  useEffect(() => {
    loadIdentity();
  }, []);

  // Set initial screen if provided
  useEffect(() => {
    if (initialScreen) {
      reset(initialScreen, initialParams);
    }
  }, [initialScreen]);

  // Global keyboard shortcuts
  useInput((input, key) => {
    // Quit
    if (input === 'q' && current.screen !== 'search' && current.screen !== 'settings') {
      exit();
      return;
    }

    // Help
    if (input === '?' && current.screen !== 'help') {
      push('help');
      return;
    }

    // Back navigation
    if (key.escape || (input === 'b' && current.screen !== 'search')) {
      if (current.screen === 'help') {
        pop();
      } else if (!pop()) {
        exit();
      }
      return;
    }

    // Quick navigation
    if (input === 'g' && current.screen !== 'search' && current.screen !== 'settings') {
      reset('timeline');
      return;
    }

    if (input === '/' && current.screen !== 'search') {
      push('search');
      return;
    }

    if (input === 'i' && current.screen !== 'settings') {
      push('settings');
      return;
    }
  });

  // Render current screen
  const renderScreen = () => {
    switch (current.screen) {
      case 'timeline':
        return <Timeline {...current.params} />;
      case 'post':
        return <PostDetail postId={current.params.postId} />;
      case 'user':
        return <UserProfile userId={current.params.userId} username={current.params.username} />;
      case 'search':
        return <Search initialQuery={current.params.query} />;
      case 'settings':
        return <Settings />;
      case 'followers':
        return <Followers userId={current.params.userId} mode={current.params.mode} />;
      case 'hashtag':
        return <Hashtag tag={current.params.tag} />;
      case 'help':
        return <Help />;
      default:
        return <Timeline />;
    }
  };

  return (
    <Box flexDirection="column" width="100%">
      {renderScreen()}
    </Box>
  );
}
