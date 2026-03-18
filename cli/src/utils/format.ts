/**
 * Text formatting utilities for terminal display
 */
import { formatDistanceToNow, format } from 'date-fns';

/**
 * Truncate text to max length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '\u2026';
}

/**
 * Wrap text to fit within width, respecting word boundaries
 */
export function wrapText(text: string, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      // Handle words longer than width
      if (word.length > width) {
        let remaining = word;
        while (remaining.length > width) {
          lines.push(remaining.slice(0, width));
          remaining = remaining.slice(width);
        }
        currentLine = remaining;
      } else {
        currentLine = word;
      }
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}

/**
 * Format relative time (e.g., "5m ago", "2h ago", "3d ago")
 */
export function relativeTime(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format short relative time (e.g., "5m", "2h", "3d")
 */
export function shortRelativeTime(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}d`;
  if (diffWeek < 52) return `${diffWeek}w`;
  return format(d, 'MMM d');
}

/**
 * Format number with abbreviation (e.g., 1.2K, 3.4M)
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

/**
 * Format credits/balance (1 DASH = 100_000_000_000 credits)
 */
export function formatCredits(credits: number): string {
  const dash = credits / 100_000_000_000;
  if (dash >= 1) {
    return dash.toFixed(4) + ' DASH';
  }
  // Show in credits if less than 1 DASH
  return formatNumber(credits) + ' credits';
}

/**
 * Pad string to width
 */
export function padRight(str: string, width: number): string {
  return str + ' '.repeat(Math.max(0, width - str.length));
}

export function padLeft(str: string, width: number): string {
  return ' '.repeat(Math.max(0, width - str.length)) + str;
}

export function padCenter(str: string, width: number): string {
  const padding = Math.max(0, width - str.length);
  const left = Math.floor(padding / 2);
  const right = padding - left;
  return ' '.repeat(left) + str + ' '.repeat(right);
}
