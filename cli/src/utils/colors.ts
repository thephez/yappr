/**
 * Color utilities and theme for terminal display
 */
import chalk from 'chalk';

// Theme colors
export const colors = {
  // Primary colors
  primary: chalk.cyan,
  secondary: chalk.gray,
  accent: chalk.magenta,

  // Text colors
  text: chalk.white,
  textMuted: chalk.gray,
  textDim: chalk.dim,

  // Status colors
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,

  // UI elements
  border: chalk.gray,
  selected: chalk.bgCyan.black,
  highlight: chalk.bold,

  // Social
  username: chalk.cyan,
  displayName: chalk.bold.white,
  timestamp: chalk.gray,
  stats: chalk.gray,

  // Interactions
  liked: chalk.red,
  reposted: chalk.green,
  bookmarked: chalk.yellow,
};

// Styled text helpers
export const styled = {
  username: (name: string) => colors.username(`@${name.replace(/^@/, '')}`),
  displayName: (name: string) => colors.displayName(name),
  timestamp: (time: string) => colors.timestamp(time),
  stat: (label: string, value: number | string) => colors.stats(`${value} ${label}`),

  // Post stats
  likes: (count: number, liked = false) =>
    liked ? colors.liked(`\u2665 ${count}`) : colors.stats(`\u2661 ${count}`),
  reposts: (count: number, reposted = false) =>
    reposted ? colors.reposted(`\u21bb ${count}`) : colors.stats(`\u21bb ${count}`),
  replies: (count: number) => colors.stats(`\u2192 ${count}`),

  // Selection
  selected: (text: string) => colors.selected(` ${text} `),

  // Headers
  header: (text: string) => colors.primary.bold(text),
  subheader: (text: string) => colors.secondary(text),

  // Keybinding hints
  key: (key: string) => chalk.bgGray.white(` ${key} `),
  hint: (key: string, action: string) => `${chalk.bgGray.white(` ${key} `)} ${chalk.gray(action)}`,
};

// Box drawing characters
export const box = {
  topLeft: '\u250c',
  topRight: '\u2510',
  bottomLeft: '\u2514',
  bottomRight: '\u2518',
  horizontal: '\u2500',
  vertical: '\u2502',
  teeRight: '\u251c',
  teeLeft: '\u2524',
  teeDown: '\u252c',
  teeUp: '\u2534',
  cross: '\u253c',
};

// Simple box drawing
export function horizontalLine(width: number): string {
  return colors.border(box.horizontal.repeat(width));
}

export function verticalLine(): string {
  return colors.border(box.vertical);
}
