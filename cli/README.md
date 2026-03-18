# Yappr CLI

Interactive terminal UI (TUI) for Yappr - browse the decentralized social network from your terminal.

## Features

- **Full-screen TUI** - Navigate with keyboard shortcuts (vim-style j/k)
- **Read-only mode** - Browse without private keys
- **Identity support** - Enter your identity ID for personalized views
- **All platform features** - Timeline, profiles, posts, search, hashtags

### Screens

| Screen | Description |
|--------|-------------|
| Timeline | Global feed and following feed (with identity) |
| Post Detail | Full post with threaded replies |
| User Profile | Profile info, posts, likes, followers |
| Search | Find users by DPNS username |
| Hashtag | Browse posts by hashtag |
| Followers | View followers/following lists |
| Settings | Set/clear identity |
| Help | Keyboard shortcut reference |

## Installation

```bash
# From the cli directory
cd cli
npm install

# Run in development mode
npm run dev
```

**Note:** Requires a TTY (interactive terminal). Won't work when piped.

## Usage

### Starting the CLI

```bash
# Default: opens timeline
npm run dev

# Open specific screen
npm run dev -- timeline
npm run dev -- user <identity-id>
npm run dev -- user --username <dpns-name>
npm run dev -- post <post-id>
npm run dev -- search [query]
npm run dev -- hashtag <tag>
npm run dev -- settings
```

### Keyboard Shortcuts

#### Global
| Key | Action |
|-----|--------|
| `q` | Quit |
| `?` | Show help |
| `b` or `Esc` | Go back |
| `g` | Go to screen (timeline/search/settings) |
| `/` | Open search |
| `i` | Set identity |

#### Navigation
| Key | Action |
|-----|--------|
| `j` or `Down` | Move down |
| `k` or `Up` | Move up |
| `Enter` | Select/open |
| `r` | Refresh |

#### Screen-specific
| Key | Action |
|-----|--------|
| `1/2` | Switch tabs (Timeline, Profile) |
| `f` | View followers (Profile) |
| `g` | View following (Profile) |
| `a` | View author (Post Detail) |

## Identity Mode

The CLI supports two modes:

### Anonymous Mode (default)
- Browse global timeline
- View any user's profile and posts
- Search users
- View hashtag posts

### Identity Mode
Set your Dash Platform identity ID to unlock:
- **Following feed** - Posts from users you follow
- **Your profile** - Quick access via `p` key
- **Interaction indicators** - See if you follow users

```bash
# Set identity via settings screen
npm run dev -- settings

# Or press `i` from any screen
```

Identity is stored in `~/.yappr/identity.json` (no private keys).

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Ink 5 (React for CLI) |
| State | Zustand |
| Styling | Chalk |
| Data | Shared services from lib/ |

## Project Structure

```
cli/
  src/
    index.tsx           # Entry point, CLI args
    app.tsx             # Main router component

    screens/            # Full-screen views
      Timeline.tsx
      PostDetail.tsx
      UserProfile.tsx
      Search.tsx
      Settings.tsx
      Followers.tsx
      Hashtag.tsx
      Help.tsx

    components/
      layout/           # Screen, Header, Footer, TabBar
      post/             # PostCard, PostFull, PostList
      user/             # UserCard, ProfileHeader, UserList
      common/           # Spinner, Error, Empty, Stats

    hooks/              # Data fetching hooks
    store/              # Zustand stores (navigation, identity)
    services/           # CLI-specific services
    utils/              # Formatting, colors, terminal
```

## Development

```bash
# Run with hot reload
npm run dev

# Build for production
npm run build

# Run built version
npm start
```

## Architecture

The CLI reuses the same service layer as the web app (`lib/services/`), ensuring:
- Consistent data fetching
- Shared caching
- No code duplication

### Future: Write Operations

The architecture is designed to support write operations by:
1. Adding secure private key input (no storage)
2. Adding action components (like, follow, post)
3. Adding confirmation dialogs

Currently read-only by design - browse safely without risking your keys.
