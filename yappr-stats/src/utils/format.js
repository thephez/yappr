/**
 * Formatting utilities for dates, times, and text
 */

/**
 * Format a date string (YYYY-MM-DD) for display
 */
export function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00Z');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Format a date string as short form (e.g., "Jan 20")
 */
export function formatDateShort(dateStr) {
  const date = new Date(dateStr + 'T00:00:00Z');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Format a timestamp for display (shows both UTC and local time)
 */
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const utc = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
  const local = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${utc} UTC (${local} local)`;
}

/**
 * Format a timestamp as time only
 */
export function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

/**
 * Format an ISO date string for display
 */
export function formatISODate(isoStr) {
  if (!isoStr) return '-';
  const date = new Date(isoStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

/**
 * Truncate a string to a maximum length
 */
export function truncate(str, maxLength = 8) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(num) {
  return num.toLocaleString('en-US');
}
