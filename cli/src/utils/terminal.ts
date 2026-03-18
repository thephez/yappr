/**
 * Terminal utilities
 */

/**
 * Get terminal dimensions
 */
export function getTerminalSize(): { width: number; height: number } {
  return {
    width: process.stdout.columns || 80,
    height: process.stdout.rows || 24,
  };
}

/**
 * Calculate available content height (minus header/footer)
 */
export function getContentHeight(headerLines = 2, footerLines = 2): number {
  const { height } = getTerminalSize();
  return Math.max(1, height - headerLines - footerLines);
}

/**
 * Calculate available content width (minus borders)
 */
export function getContentWidth(padding = 2): number {
  const { width } = getTerminalSize();
  return Math.max(20, width - padding * 2);
}
