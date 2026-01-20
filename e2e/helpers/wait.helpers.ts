import { Page, expect, Locator } from '@playwright/test';

/**
 * Wait helpers to replace arbitrary waitForTimeout calls.
 *
 * Guidelines:
 * - NEVER use page.waitForTimeout() for waiting on UI state changes
 * - Use condition-based waits (expect().toBeVisible, waitForSelector, etc.)
 * - If you must wait for a specific time (e.g., blockchain sync), document why
 *
 * Common patterns replaced:
 * - `await page.waitForTimeout(3000)` -> `await waitForNetworkIdle(page)` or `await waitForElement(page, selector)`
 * - `await page.waitForTimeout(5000)` for posts -> `await waitForPostsToLoad(page)`
 * - `await page.waitForTimeout(500)` for UI updates -> usually not needed with Playwright's auto-wait
 */

/**
 * Wait for network to become idle (no pending requests for 500ms)
 */
export async function waitForNetworkIdle(page: Page, timeout: number = 30000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for an element to be visible
 */
export async function waitForElement(
  page: Page,
  selector: string | Locator,
  timeout: number = 10000
): Promise<void> {
  const locator = typeof selector === 'string' ? page.locator(selector) : selector;
  await expect(locator).toBeVisible({ timeout });
}

/**
 * Wait for an element to disappear
 */
export async function waitForElementToDisappear(
  page: Page,
  selector: string | Locator,
  timeout: number = 10000
): Promise<void> {
  const locator = typeof selector === 'string' ? page.locator(selector) : selector;
  await expect(locator).not.toBeVisible({ timeout });
}

/**
 * Wait for posts to load in a feed
 * Looks for post cards or the "no posts" message
 */
export async function waitForPostsToLoad(page: Page, timeout: number = 30000): Promise<void> {
  // Wait for either posts to appear or "no posts" message
  const postsOrEmpty = page.locator('[data-testid="post-card"]')
    .or(page.getByText(/no posts/i))
    .or(page.locator('article')) // Common post container
    .first();

  await expect(postsOrEmpty).toBeVisible({ timeout });
}

/**
 * Wait for private feed data to load
 * Checks for private feed UI elements
 */
export async function waitForPrivateFeedLoad(page: Page, timeout: number = 30000): Promise<void> {
  // Wait for any of these indicators that private feed state has loaded
  const indicators = [
    page.getByText(/private feed/i),
    page.getByText(/enable.*private/i),
    page.locator('[data-testid="private-feed-status"]'),
    page.getByText(/encryption key/i),
  ];

  await expect(async () => {
    for (const indicator of indicators) {
      if (await indicator.isVisible().catch(() => false)) {
        return;
      }
    }
    throw new Error('Private feed data not loaded');
  }).toPass({ timeout, intervals: [500, 1000, 2000] });
}

/**
 * Wait for a modal to finish animating and be fully visible
 */
export async function waitForModalReady(page: Page, timeout: number = 5000): Promise<Locator> {
  const modal = page.locator('[role="dialog"]');
  await expect(modal).toBeVisible({ timeout });
  // Brief moment for animation to settle
  await page.waitForTimeout(100); // Small animation buffer is acceptable
  return modal;
}

/**
 * Wait for a button/element to become enabled
 */
export async function waitForEnabled(
  page: Page,
  selector: string | Locator,
  timeout: number = 10000
): Promise<void> {
  const locator = typeof selector === 'string' ? page.locator(selector) : selector;
  await expect(locator).toBeEnabled({ timeout });
}

/**
 * Wait for a toast notification to appear
 */
export async function waitForToast(
  page: Page,
  textPattern?: RegExp | string,
  timeout: number = 30000
): Promise<void> {
  const toast = textPattern
    ? page.locator('[role="alert"]').filter({ hasText: textPattern })
    : page.locator('[role="alert"]');

  await expect(toast).toBeVisible({ timeout });
}

/**
 * Wait for blockchain operation to complete
 * This is one of the few cases where a longer wait with polling is acceptable
 */
export async function waitForBlockchainOperation(
  page: Page,
  successIndicator: () => Promise<boolean>,
  timeout: number = 60000
): Promise<void> {
  await expect(async () => {
    const success = await successIndicator();
    if (!success) throw new Error('Blockchain operation not complete');
  }).toPass({ timeout, intervals: [1000, 2000, 5000, 10000] });
}

/**
 * Wait for navigation to complete to a specific path
 */
export async function waitForNavigation(
  page: Page,
  pathPattern: RegExp | string,
  timeout: number = 30000
): Promise<void> {
  if (typeof pathPattern === 'string') {
    await page.waitForURL(`**${pathPattern}**`, { timeout });
  } else {
    await expect(page).toHaveURL(pathPattern, { timeout });
  }
}

/**
 * Utility: Safe click that waits for element to be actionable
 */
export async function safeClick(
  page: Page,
  selector: string | Locator,
  options?: { timeout?: number }
): Promise<void> {
  const locator = typeof selector === 'string' ? page.locator(selector) : selector;
  await locator.click({ timeout: options?.timeout ?? 10000 });
}

/**
 * Utility: Fill with auto-wait for element to be ready
 */
export async function safeFill(
  page: Page,
  selector: string | Locator,
  value: string,
  options?: { timeout?: number }
): Promise<void> {
  const locator = typeof selector === 'string' ? page.locator(selector) : selector;
  await expect(locator).toBeVisible({ timeout: options?.timeout ?? 10000 });
  await locator.fill(value);
}
