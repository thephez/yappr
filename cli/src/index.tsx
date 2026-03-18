#!/usr/bin/env node
/**
 * CLI entry point - initializes SDK and renders App
 */
import React from 'react';
import { render } from 'ink';
import { cliSdkService } from './services/cli-sdk.js';
import { App } from './app.js';
import type { ScreenType } from './store/navigation.js';

async function main() {
  // Parse command line args
  const args = process.argv.slice(2);
  let initialScreen: ScreenType = 'timeline';
  let initialParams: Record<string, any> = {};

  // Simple arg parsing
  if (args.length > 0) {
    const command = args[0];

    switch (command) {
      case 'timeline':
      case 'feed':
        initialScreen = 'timeline';
        break;

      case 'user':
      case 'profile':
        if (args[1]) {
          initialScreen = 'user';
          // Check if it's an identity ID or username
          if (args[1].startsWith('@')) {
            initialParams = { username: args[1].slice(1) };
          } else {
            initialParams = { username: args[1] };
          }
        }
        break;

      case 'post':
        if (args[1]) {
          initialScreen = 'post';
          initialParams = { postId: args[1] };
        }
        break;

      case 'search':
        initialScreen = 'search';
        if (args[1]) {
          initialParams = { query: args.slice(1).join(' ') };
        }
        break;

      case 'hashtag':
      case 'tag':
        if (args[1]) {
          initialScreen = 'hashtag';
          initialParams = { tag: args[1].replace(/^#/, '') };
        }
        break;

      case 'settings':
      case 'config':
        initialScreen = 'settings';
        break;

      case 'help':
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;

      case 'version':
      case '--version':
      case '-v':
        console.log('yappr-cli v0.1.0');
        process.exit(0);
        break;

      default:
        // Assume it's a username if starts with @
        if (command.startsWith('@')) {
          initialScreen = 'user';
          initialParams = { username: command.slice(1) };
        }
        break;
    }
  }

  try {
    // Initialize SDK
    await cliSdkService.initialize({ quiet: false });

    // Clear screen and render app
    console.clear();

    const { waitUntilExit } = render(
      <App initialScreen={initialScreen} initialParams={initialParams} />
    );

    await waitUntilExit();
  } catch (error) {
    console.error('Failed to start:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
yappr-cli - Interactive CLI for Yappr

USAGE:
  yappr-cli [command] [args]

COMMANDS:
  timeline, feed     View the global timeline (default)
  user <username>    View a user's profile
  post <postId>      View a specific post
  search [query]     Search for users
  hashtag <tag>      View posts with hashtag
  settings           Configure identity
  help               Show this help message

EXAMPLES:
  yappr-cli                    # Open timeline
  yappr-cli @alice             # View alice's profile
  yappr-cli user alice         # Same as above
  yappr-cli search bob         # Search for users named bob
  yappr-cli hashtag dash       # View posts with #dash

KEYBOARD SHORTCUTS:
  j/k, arrows  Navigate up/down
  Enter        Select/open
  b, Esc       Go back
  g            Go to timeline
  /            Open search
  i            Open settings
  r            Refresh
  ?            Show help
  q            Quit
`);
}

main();
