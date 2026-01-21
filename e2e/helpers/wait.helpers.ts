import { Page, expect, Locator } from '@playwright/test';

/**
 * Timeout constants for different operation types.
 * These should be used consistently across all wait helpers.
 */
export const WAIT_TIMEOUTS = {
  /** Short UI animations (dropdowns, modals opening) */
  SHORT: 2000,
  /** Standard UI operations (element visibility, state changes) */
  UI: 10000,
  /** Network operations (API calls, data loading) */
  NETWORK: 30000,
  /** Blockchain operations (state transitions, confirmations) */
  BLOCKCHAIN: 60000,
} as const;

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

/**
 * Wait for private feed status indicators to load.
 * Replaces `await page.waitForTimeout(3000)` after navigating to private feed settings.
 *
 * @param page - Playwright page object
 * @param timeout - Maximum time to wait (default: NETWORK timeout)
 */
export async function waitForPrivateFeedStatus(page: Page, timeout = WAIT_TIMEOUTS.NETWORK): Promise<void> {
  await expect(async () => {
    // Check for any private feed status indicators
    const indicators = [
      page.locator('[data-testid="private-feed-status"]'),
      page.locator('[data-testid="visibility-selector"]'),
      page.getByText(/private feed dashboard/i),
      page.getByText(/your private feed/i),
      page.getByText(/private feed is enabled/i),
      page.getByText(/enable.*private/i),
      page.getByText(/encryption key/i),
      page.locator('button').filter({ hasText: /enter.*encryption.*key/i }),
    ];

    for (const indicator of indicators) {
      if (await indicator.first().isVisible().catch(() => false)) {
        return;
      }
    }
    throw new Error('Private feed status not loaded');
  }).toPass({ timeout, intervals: [500, 1000, 2000] });
}

/**
 * Wait for a dropdown/listbox to open and be interactive.
 * Replaces `await page.waitForTimeout(500)` after clicking dropdown trigger.
 *
 * @param page - Playwright page object
 * @param timeout - Maximum time to wait (default: SHORT timeout)
 */
export async function waitForDropdown(page: Page, timeout = WAIT_TIMEOUTS.SHORT): Promise<void> {
  await page.waitForFunction(() => {
    const dropdown = document.querySelector('[role="listbox"], [role="menu"], [data-state="open"]');
    return dropdown !== null;
  }, { timeout });
}

/**
 * Wait for follower access state to change.
 * Replaces `await page.waitForTimeout(2000)` after approval/revoke actions.
 *
 * @param page - Playwright page object
 * @param expectedState - The state to wait for
 * @param timeout - Maximum time to wait (default: BLOCKCHAIN timeout)
 */
export async function waitForAccessStateChange(
  page: Page,
  expectedState: 'pending' | 'approved' | 'revoked' | 'none',
  timeout = WAIT_TIMEOUTS.BLOCKCHAIN
): Promise<void> {
  const statePatterns: Record<string, RegExp> = {
    pending: /pending|request.*sent|awaiting/i,
    approved: /approved|following|access.*granted|decrypted/i,
    revoked: /revoked|access.*removed|no.*access/i,
    none: /request.*access|follow/i,
  };

  await expect(async () => {
    const pattern = statePatterns[expectedState];
    const hasState = await page.getByText(pattern).first().isVisible().catch(() => false);
    if (!hasState) {
      throw new Error(`Access state not changed to ${expectedState}`);
    }
  }).toPass({ timeout, intervals: [500, 1000, 2000, 5000] });
}

/**
 * Wait for post decryption to complete.
 * Replaces `await page.waitForTimeout(3000)` when viewing encrypted posts.
 *
 * @param page - Playwright page object
 * @param timeout - Maximum time to wait (default: UI timeout)
 */
export async function waitForDecryption(page: Page, timeout = WAIT_TIMEOUTS.UI): Promise<void> {
  await expect(async () => {
    // Check that decryption loading indicator is gone
    const loading = await page.locator('[data-testid="decryption-loading"]').isVisible().catch(() => false);
    const spinner = await page.locator('[data-testid="decrypting-spinner"]').isVisible().catch(() => false);
    const decryptingText = await page.getByText(/decrypting/i).isVisible().catch(() => false);

    if (loading || spinner || decryptingText) {
      throw new Error('Decryption still in progress');
    }
  }).toPass({ timeout, intervals: [200, 500, 1000] });
}

/**
 * Wait for page data to settle after navigation or reload.
 * Replaces `await page.waitForTimeout(2000)` after page.reload() or navigation.
 *
 * @param page - Playwright page object
 * @param timeout - Maximum time to wait (default: NETWORK timeout)
 */
export async function waitForPageReady(page: Page, timeout = WAIT_TIMEOUTS.NETWORK): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
  // Also wait for any loading indicators to disappear
  await expect(async () => {
    const loadingSpinner = await page.locator('[data-testid="loading"], .animate-spin').first().isVisible().catch(() => false);
    if (loadingSpinner) {
      throw new Error('Page still loading');
    }
  }).toPass({ timeout: 5000, intervals: [200, 500, 1000] });
}

/**
 * Wait for a button click action to complete (useful after clicking approve/revoke/etc).
 * Replaces `await page.waitForTimeout(1000-2000)` after button clicks.
 *
 * @param page - Playwright page object
 * @param successIndicator - Text pattern or locator to indicate success
 * @param timeout - Maximum time to wait (default: BLOCKCHAIN timeout)
 */
export async function waitForActionComplete(
  page: Page,
  successIndicator: RegExp | string | Locator,
  timeout = WAIT_TIMEOUTS.BLOCKCHAIN
): Promise<void> {
  if (typeof successIndicator === 'string' || successIndicator instanceof RegExp) {
    await expect(page.getByText(successIndicator).first()).toBeVisible({ timeout });
  } else {
    await expect(successIndicator).toBeVisible({ timeout });
  }
}

/**
 * Wait for modal content to be ready after opening.
 * Replaces `await page.waitForTimeout(1000)` after opening modals.
 *
 * @param page - Playwright page object
 * @param contentSelector - Optional selector for expected content within modal
 * @param timeout - Maximum time to wait (default: UI timeout)
 */
export async function waitForModalContent(
  page: Page,
  contentSelector?: string | Locator,
  timeout = WAIT_TIMEOUTS.UI
): Promise<void> {
  const modal = page.locator('[role="dialog"]');
  await expect(modal).toBeVisible({ timeout });

  if (contentSelector) {
    const content = typeof contentSelector === 'string' ? modal.locator(contentSelector) : contentSelector;
    await expect(content).toBeVisible({ timeout });
  }
}

/**
 * Wait for feed content to load after navigation.
 * Replaces `await page.waitForTimeout(3000-5000)` after navigating to feed.
 *
 * @param page - Playwright page object
 * @param timeout - Maximum time to wait (default: NETWORK timeout)
 */
export async function waitForFeedReady(page: Page, timeout = WAIT_TIMEOUTS.NETWORK): Promise<void> {
  await expect(async () => {
    // Check for feed indicators - posts, compose button, or empty state
    const indicators = [
      page.locator('article').first(),
      page.locator('[data-testid="post-card"]').first(),
      page.getByRole('button', { name: /what.?s happening/i }),
      page.getByText(/no posts/i),
    ];

    for (const indicator of indicators) {
      if (await indicator.isVisible().catch(() => false)) {
        return;
      }
    }
    throw new Error('Feed not ready');
  }).toPass({ timeout, intervals: [500, 1000, 2000] });
}

/**
 * Wait for notification list to load.
 * Replaces `await page.waitForTimeout(3000-5000)` after navigating to notifications.
 *
 * @param page - Playwright page object
 * @param timeout - Maximum time to wait (default: NETWORK timeout)
 */
export async function waitForNotificationsReady(page: Page, timeout = WAIT_TIMEOUTS.NETWORK): Promise<void> {
  await expect(async () => {
    // Check for notification indicators
    const indicators = [
      page.locator('[data-testid="notification-item"]').first(),
      page.getByText(/no notifications/i),
      page.locator('button').filter({ hasText: /all|follows|mentions|private feed/i }).first(),
    ];

    for (const indicator of indicators) {
      if (await indicator.isVisible().catch(() => false)) {
        return;
      }
    }
    throw new Error('Notifications not ready');
  }).toPass({ timeout, intervals: [500, 1000, 2000] });
}

/**
 * Wait for settings page to be ready.
 * Replaces `await page.waitForTimeout(3000)` after navigating to settings.
 *
 * @param page - Playwright page object
 * @param section - Optional section to wait for
 * @param timeout - Maximum time to wait (default: NETWORK timeout)
 */
export async function waitForSettingsReady(page: Page, section?: string, timeout = WAIT_TIMEOUTS.NETWORK): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });

  if (section === 'privateFeed') {
    await waitForPrivateFeedStatus(page, timeout);
  } else {
    // Wait for general settings UI
    await expect(async () => {
      const settingsUI = page.getByRole('heading', { name: /settings/i })
        .or(page.locator('[data-testid="settings-page"]'));
      const isVisible = await settingsUI.first().isVisible().catch(() => false);
      if (!isVisible) {
        throw new Error('Settings page not ready');
      }
    }).toPass({ timeout, intervals: [500, 1000] });
  }
}
