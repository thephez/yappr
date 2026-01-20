import { Page, expect } from '@playwright/test';

/**
 * Timeout constants for modal operations
 */
export const MODAL_TIMEOUTS = {
  /** Time to wait for modal to appear */
  MODAL_APPEAR: 5000,
  /** Time to wait for modal to close */
  MODAL_CLOSE: 10000,
  /** Time to wait for blockchain sync operations */
  BLOCKCHAIN_SYNC: 30000,
  /** Short wait for UI animations */
  ANIMATION: 1000,
} as const;

/**
 * Identity type for encryption key operations
 */
export interface IdentityWithEncryptionKey {
  keys: {
    encryptionKey?: string;
  };
}

/**
 * Handle the "Enter Encryption Key" modal that appears when
 * the private feed state needs to sync during approval/revocation.
 *
 * This is a consolidated helper used across multiple test files.
 *
 * @param page - Playwright page object
 * @param identity - Identity object containing the encryption key, or the key string directly
 * @returns true if modal was found and handled, false otherwise
 */
export async function handleEncryptionKeyModal(
  page: Page,
  identity: IdentityWithEncryptionKey | string
): Promise<boolean> {
  // Extract the encryption key from identity object or use string directly
  const encryptionKey = typeof identity === 'string'
    ? identity
    : identity.keys.encryptionKey;

  // Look for the "Enter Encryption Key" heading specifically
  const encryptionHeading = page.getByRole('heading', { name: /Enter Encryption Key/i });
  const hasEncryptionModal = await encryptionHeading.isVisible({ timeout: MODAL_TIMEOUTS.MODAL_APPEAR }).catch(() => false);

  if (!hasEncryptionModal) {
    // Also check for text-based detection as fallback
    const textIndicators = [
      page.getByText(/enter.*encryption.*key/i),
      page.getByText(/encryption.*private.*key/i),
    ];

    let found = false;
    for (const indicator of textIndicators) {
      if (await indicator.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        found = true;
        break;
      }
    }

    if (!found) return false;
  }

  // Handle case where no encryption key is available
  if (!encryptionKey) {
    console.warn('Encryption key modal appeared but no encryption key provided');
    // Try to dismiss via DOM evaluation
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const skipBtn = buttons.find(b => b.textContent?.toLowerCase().includes('skip'));
      if (skipBtn) skipBtn.click();
    });
    await page.waitForTimeout(2000);
    return false;
  }

  // Use DOM evaluation to find and fill the input in the encryption key modal
  const filled = await page.evaluate((key) => {
    // Find the heading
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
    const heading = headings.find(h => h.textContent?.toLowerCase().includes('enter encryption key'));
    if (!heading) return false;

    // Find the modal container
    let container: Element | null = heading.parentElement;
    while (container && container.querySelectorAll('input').length === 0) {
      container = container.parentElement;
    }
    if (!container) return false;

    // Find the password/text input
    const input = container.querySelector('input[type="password"]') ||
                  container.querySelector('input[type="text"]') ||
                  container.querySelector('input');
    if (!input) return false;

    // Fill the input
    const inputEl = input as HTMLInputElement;
    inputEl.value = key;
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));

    return true;
  }, encryptionKey);

  if (!filled) {
    console.warn('Could not fill encryption key input');
    return false;
  }

  // Wait briefly for React state to update
  await page.waitForTimeout(500);

  // Click the Save Key button via DOM evaluation
  const clicked = await page.evaluate(() => {
    // Find the heading to scope our search
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
    const heading = headings.find(h => h.textContent?.toLowerCase().includes('enter encryption key'));
    if (!heading) return false;

    // Find the modal container
    let container: Element | null = heading.parentElement;
    while (container && container.querySelectorAll('button').length < 2) {
      container = container.parentElement;
    }
    if (!container) return false;

    // Look for Save Key button within the container
    const buttons = Array.from(container.querySelectorAll('button'));
    const saveBtn = buttons.find(b => {
      const text = b.textContent?.toLowerCase() || '';
      return text.includes('save');
    });
    if (saveBtn && !saveBtn.disabled) {
      saveBtn.click();
      return true;
    }

    // Fallback: look for any confirm-like button
    const confirmBtn = buttons.find(b => {
      const text = b.textContent?.toLowerCase() || '';
      return text.includes('confirm') || text.includes('submit');
    });
    if (confirmBtn && !confirmBtn.disabled) {
      confirmBtn.click();
      return true;
    }

    // Last resort: click first non-skip button
    const nonSkipBtn = buttons.find(b => {
      const text = b.textContent?.toLowerCase() || '';
      return !text.includes('skip') && !b.disabled;
    });
    if (nonSkipBtn) {
      nonSkipBtn.click();
      return true;
    }

    return false;
  });

  if (clicked) {
    // Wait for modal to close
    await page.waitForTimeout(3000);
    // Check if heading is still visible
    const stillVisible = await page.getByRole('heading', { name: /Enter Encryption Key/i })
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    return !stillVisible;
  }

  return false;
}

/**
 * Dismiss post-login modals (username registration, key backup, etc.)
 *
 * Uses DOM evaluation for reliable modal dismissal since these modals
 * may have complex React state and animation behaviors.
 *
 * @param page - Playwright page object
 * @param maxAttempts - Maximum number of modals to try to dismiss (default: 10)
 */
export async function dismissPostLoginModals(page: Page, maxAttempts: number = 10): Promise<void> {
  // Give modals time to appear after login
  await page.waitForTimeout(3000);

  for (let i = 0; i < maxAttempts; i++) {
    // Check for modal indicators - the modals in this app don't use role="dialog"
    // Instead they have backdrop-blur-sm or visible headings
    const hasKeyBackup = await page.getByRole('heading', { name: 'Backup Your Key' }).isVisible({ timeout: 1000 }).catch(() => false);
    const hasRegister = await page.getByRole('heading', { name: 'Register Username' }).isVisible({ timeout: 1000 }).catch(() => false);
    const hasBackdrop = await page.locator('.backdrop-blur-sm').isVisible({ timeout: 500 }).catch(() => false);

    if (!hasKeyBackup && !hasRegister && !hasBackdrop) {
      // No more modals
      return;
    }

    // Strategy 1: Handle "Backup Your Key" modal via DOM evaluation
    if (hasKeyBackup) {
      const dismissed = await page.evaluate(() => {
        // Find the Backup Your Key heading
        const headings = Array.from(document.querySelectorAll('h1'));
        const heading = headings.find(h => h.textContent?.includes('Backup Your Key'));
        if (!heading) return false;

        // Find the modal container - walk up to find a container with buttons
        let container: Element | null = heading.parentElement;
        while (container && container.querySelectorAll('button').length === 0) {
          container = container.parentElement;
        }
        if (!container) return false;

        // Look for Skip button first (scroll into view)
        const buttons = Array.from(container.querySelectorAll('button'));
        const skipBtn = buttons.find(b => b.textContent?.toLowerCase().includes('skip'));
        if (skipBtn) {
          skipBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
          skipBtn.click();
          return true;
        }

        // If no skip button, click the first button (likely the X close button)
        if (buttons.length > 0) {
          buttons[0].click();
          return true;
        }

        return false;
      });

      if (dismissed) {
        await page.waitForTimeout(2000);
        continue;
      }
    }

    // Strategy 2: Handle "Register Username" modal via DOM evaluation
    if (hasRegister) {
      const dismissed = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1'));
        const heading = headings.find(h => h.textContent?.includes('Register Username'));
        if (!heading) return false;

        // Find the modal container - walk up to find a container with buttons
        let container: Element | null = heading.parentElement;
        while (container && container.querySelectorAll('button').length === 0) {
          container = container.parentElement;
        }
        if (!container) return false;

        const buttons = Array.from(container.querySelectorAll('button'));
        const skipBtn = buttons.find(b => b.textContent?.toLowerCase().includes('skip'));
        if (skipBtn) {
          skipBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
          skipBtn.click();
          return true;
        }

        return false;
      });

      if (dismissed) {
        await page.waitForTimeout(2000);
        continue;
      }
    }

    // Strategy 3: Generic - try to find and click any skip/close button via DOM
    const dismissed = await page.evaluate(() => {
      // Look for any Skip for now button
      const buttons = Array.from(document.querySelectorAll('button'));
      const skipBtn = buttons.find(b => b.textContent?.toLowerCase().includes('skip for now'));
      if (skipBtn && skipBtn.offsetParent !== null) {
        skipBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
        skipBtn.click();
        return true;
      }

      // Look for close/cancel button
      const closeBtn = buttons.find(b => {
        const text = b.textContent?.toLowerCase() || '';
        return text.includes('cancel') || text.includes('close');
      });
      if (closeBtn && closeBtn.offsetParent !== null) {
        closeBtn.click();
        return true;
      }

      // Look for icon-only button (likely close X)
      const iconBtn = buttons.find(b => {
        const text = (b.textContent || '').trim();
        return text.length === 0 && b.querySelector('svg') && b.offsetParent !== null;
      });
      if (iconBtn) {
        iconBtn.click();
        return true;
      }

      return false;
    });

    if (dismissed) {
      await page.waitForTimeout(1500);
      continue;
    }

    // Strategy 4: Try Escape key as last resort
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
  }
}

/**
 * Wait for a modal to appear and return its locator
 *
 * @param page - Playwright page object
 * @param timeout - How long to wait for modal (default: 5000ms)
 * @returns The modal locator if found
 */
export async function waitForModal(page: Page, timeout: number = MODAL_TIMEOUTS.MODAL_APPEAR): Promise<ReturnType<Page['locator']>> {
  const modal = page.locator('[role="dialog"]');
  await expect(modal).toBeVisible({ timeout });
  return modal;
}

/**
 * Close any open modal by clicking outside or pressing Escape
 *
 * @param page - Playwright page object
 */
export async function closeModal(page: Page): Promise<void> {
  const modal = page.locator('[role="dialog"]');
  if (await modal.isVisible({ timeout: 1000 }).catch(() => false)) {
    // Try Escape first
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible({ timeout: MODAL_TIMEOUTS.MODAL_CLOSE }).catch(async () => {
      // If Escape didn't work, try clicking close button
      const closeBtn = modal.locator('button[aria-label="Close"]').or(
        modal.locator('button').filter({ hasText: /close|cancel/i })
      );
      if (await closeBtn.first().isVisible({ timeout: 500 }).catch(() => false)) {
        await closeBtn.first().click();
        await expect(modal).not.toBeVisible({ timeout: MODAL_TIMEOUTS.MODAL_CLOSE });
      }
    });
  }
}
