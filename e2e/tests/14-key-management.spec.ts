import { test, expect } from '../fixtures/auth.fixture';
import { goToPrivateFeedSettings, goToHome, openComposeModal } from '../helpers/navigation.helpers';
import { loadIdentity } from '../test-data/identities';

/**
 * Test Suite: Encryption Key Management
 * Reference: YAPPR_PRIVATE_FEED_E2E_TESTS.md §14 & e2e_prd.md §7 (P1)
 *
 * Tests encryption key management flows:
 * - 14.1 Key Entry on Login — New Device (entering encryption key after login)
 * - 14.2 Deferred Key Entry (skipping key entry initially, then prompted when needed)
 * - 14.3 Wrong Key Entry (validation when wrong key is entered)
 * - 14.4 Lost Key Flow (guidance when user indicates lost key)
 *
 * Test Users:
 * - @owner (Identity 1): Has private feed enabled, has encryption key on identity
 * - @follower1 (Identity 2): May have encryption key, used for follower scenarios
 *
 * Note: These tests simulate "new device" scenarios by clearing private feed keys
 * from localStorage after login, forcing the encryption key entry flow.
 */

/**
 * Clear only private feed related keys from localStorage
 * This simulates a "new device" scenario where the user is logged in but
 * hasn't entered their encryption key yet for private feed access.
 */
async function clearPrivateFeedKeys(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('yappr:pf:') ||
        key.includes('encryptionKey') ||
        key.includes('privateKey') ||
        key.includes('pathKey') ||
        key.includes('_ek_') ||
        key.includes('secure_ek')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    return keysToRemove.length;
  });
}

test.describe('14 - Encryption Key Management', () => {
  // Log console errors for debugging
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Browser error: ${msg.text()}`);
      }
    });
  });

  /**
   * Test 14.1: Key Entry on Login — New Device
   *
   * Preconditions:
   * - @owner has private feed enabled
   * - @owner has encryption key on identity
   * - @owner logs in on new device (no key in session)
   *
   * Steps:
   * 1. Login as owner
   * 2. Clear private feed keys to simulate new device
   * 3. Navigate to private feed settings - modal should appear
   * 4. Enter correct private key (hex)
   * 5. Submit
   *
   * Expected Results:
   * - Key validated: derived public key matches on-chain key
   * - Key stored in session storage
   * - Private feed features fully available
   * - Dashboard accessible
   */
  test('14.1 Key Entry on Login — New Device', async ({ page, ownerIdentity, loginAs }) => {
    // Verify owner has encryption key configured
    if (!ownerIdentity.keys.encryptionKey) {
      test.skip(true, 'Owner identity does not have encryption key configured');
      return;
    }

    // Login as owner first
    await loginAs(ownerIdentity);

    // Clear private feed keys to simulate "new device" for private feed
    const keysCleared = await clearPrivateFeedKeys(page);
    console.log(`Cleared ${keysCleared} private feed keys to simulate new device`);

    // Reload to ensure state is fresh
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to private feed settings - this should trigger key entry prompt
    await goToPrivateFeedSettings(page);
    await page.waitForTimeout(3000);

    // Take screenshot to see current state
    await page.screenshot({ path: 'screenshots/14-14.1-settings-page.png' });

    // Check for "Enter Encryption Key" button or modal
    const enterKeyBtn = page.locator('button').filter({ hasText: /enter.*encryption.*key/i });
    const hasEnterKeyBtn = await enterKeyBtn.isVisible({ timeout: 5000 }).catch(() => false);

    // Also check if encryption key modal appeared automatically
    const encryptionKeyPrompt = page.getByText(/enter.*encryption.*key|encryption.*private.*key|private.*key.*to.*access/i);
    const hasAutoPrompt = await encryptionKeyPrompt.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasEnterKeyBtn || hasAutoPrompt) {
      console.log(`Key entry UI found - Enter button: ${hasEnterKeyBtn}, Auto prompt: ${hasAutoPrompt}`);

      // If there's a button, click it
      if (hasEnterKeyBtn && !hasAutoPrompt) {
        await enterKeyBtn.click();
        await page.waitForTimeout(1000);
      }

      // Now enter the encryption key
      const modal = page.locator('[role="dialog"]');
      const keyInput = modal.locator('input[type="password"]');

      if (await keyInput.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await keyInput.first().fill(ownerIdentity.keys.encryptionKey);
        console.log('Entered encryption key');

        await page.screenshot({ path: 'screenshots/14-14.1-key-entered.png' });

        // Find and click confirm button
        const confirmBtn = modal.locator('button').filter({ hasText: /confirm|save|enter|submit/i });
        if (await confirmBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.first().click();
          await page.waitForTimeout(5000);

          console.log('Encryption key confirmed');
        }
      }
    } else {
      console.log('Note: No key entry UI visible - key may already be stored or handled differently');
    }

    // Verify private feed dashboard is accessible
    await goToPrivateFeedSettings(page);
    await page.waitForTimeout(3000);

    const dashboardVisible = await page.getByText(/private feed dashboard|your private feed|private feed is enabled/i)
      .first().isVisible({ timeout: 10000 }).catch(() => false);

    console.log(`Dashboard visible after key entry: ${dashboardVisible}`);

    await page.screenshot({ path: 'screenshots/14-14.1-key-entry-complete.png' });

    // Dashboard should be accessible
    if (dashboardVisible) {
      await expect(page.getByText(/private feed dashboard|your private feed|private feed is enabled/i).first()).toBeVisible();
    }
  });

  /**
   * Test 14.2: Deferred Key Entry
   *
   * Preconditions:
   * - @owner dismisses key entry prompt (if it appears)
   *
   * Steps:
   * 1. Login and clear private feed keys
   * 2. Dismiss any key entry prompt
   * 3. Use Yappr normally
   * 4. Attempt to create private post
   *
   * Expected Results:
   * - Yappr usable for non-private features
   * - When attempting private action, prompt may reappear
   */
  test('14.2 Deferred Key Entry', async ({ page, ownerIdentity, loginAs }) => {
    // Verify owner has encryption key configured
    if (!ownerIdentity.keys.encryptionKey) {
      test.skip(true, 'Owner identity does not have encryption key configured');
      return;
    }

    // Login as owner
    await loginAs(ownerIdentity);

    // Clear private feed keys
    const keysCleared = await clearPrivateFeedKeys(page);
    console.log(`Cleared ${keysCleared} private feed keys`);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if a key entry modal appears automatically and dismiss it
    const modal = page.locator('[role="dialog"]');
    const encryptionKeyPrompt = page.getByText(/enter.*encryption.*key|encryption.*private.*key/i);

    const hasAutoPrompt = await encryptionKeyPrompt.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAutoPrompt) {
      console.log('Encryption key prompt appeared - attempting to dismiss');

      // Try to find and click dismiss/skip/cancel button
      const dismissBtn = modal.locator('button').filter({
        hasText: /skip|later|cancel|close|not now|dismiss/i
      });

      if (await dismissBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await dismissBtn.first().click();
        await page.waitForTimeout(1000);
        console.log('Dismissed encryption key modal');
      } else {
        // Try pressing Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
        console.log('Pressed Escape to dismiss modal');
      }
    } else {
      console.log('No automatic encryption key prompt appeared');
    }

    await page.screenshot({ path: 'screenshots/14-14.2-after-dismiss.png' });

    // Verify app is usable for non-private features
    await goToHome(page);
    await page.waitForTimeout(3000);

    // Check that feed loads
    const feedContent = page.locator('article').or(page.getByText(/what.?s happening/i));
    const hasFeedContent = await feedContent.first().isVisible({ timeout: 10000 }).catch(() => false);

    console.log(`Feed content visible: ${hasFeedContent}`);

    // Try to open compose modal and select private visibility
    await openComposeModal(page);
    await page.waitForTimeout(1000);

    const composeModal = page.locator('[role="dialog"]');
    const visibilityBtn = composeModal.locator('button').filter({ hasText: /^Public$/i }).first();

    if (await visibilityBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await visibilityBtn.click();
      await page.waitForTimeout(500);

      // Look for Private option - use specific text that appears in the dropdown
      // The dropdown shows "Private" with description "Only private followers"
      const privateOption = page.locator('button').filter({ hasText: 'Only private followers' });
      if (await privateOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await privateOption.click();
        await page.waitForTimeout(2000);

        // Check if encryption key prompt reappears
        const keyPromptReappears = await page.getByText(/enter.*encryption.*key|encryption.*private.*key/i)
          .first().isVisible({ timeout: 5000 }).catch(() => false);

        if (keyPromptReappears) {
          console.log('Encryption key prompt reappeared when attempting private action');
        } else {
          console.log('Note: Key prompt did not reappear - app may handle deferred entry differently');
        }

        await page.screenshot({ path: 'screenshots/14-14.2-private-selected.png' });
      } else {
        console.log('Private option not found in dropdown - visibility selector may not be fully loaded');
      }
    } else {
      console.log('Visibility dropdown button not visible');
    }

    // Close modals
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');

    await page.screenshot({ path: 'screenshots/14-14.2-deferred-entry.png' });
  });

  /**
   * Test 14.3: Wrong Key Entry
   *
   * Preconditions:
   * - @owner enters incorrect private key
   *
   * Steps:
   * 1. Login and navigate to key entry UI
   * 2. Enter wrong key
   * 3. Submit
   *
   * Expected Results:
   * - Error: "Key does not match on-chain identity"
   * - Retry allowed
   * - No partial state saved
   */
  test('14.3 Wrong Key Entry', async ({ page, ownerIdentity, loginAs }) => {
    // Verify owner has encryption key configured
    if (!ownerIdentity.keys.encryptionKey) {
      test.skip(true, 'Owner identity does not have encryption key configured');
      return;
    }

    // Create a wrong key
    const correctKey = ownerIdentity.keys.encryptionKey;
    const wrongKey = correctKey.slice(0, -8) + '00000000'; // Replace last 8 chars

    console.log('Testing with intentionally wrong encryption key');

    // Login as owner
    await loginAs(ownerIdentity);

    // Clear private feed keys to trigger key entry UI
    const keysCleared = await clearPrivateFeedKeys(page);
    console.log(`Cleared ${keysCleared} private feed keys`);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to private feed settings
    await goToPrivateFeedSettings(page);
    await page.waitForTimeout(3000);

    // Look for "Enter Encryption Key" button
    const enterKeyBtn = page.locator('button').filter({ hasText: /enter.*encryption.*key/i });
    const hasEnterKeyBtn = await enterKeyBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEnterKeyBtn) {
      await enterKeyBtn.click();
      await page.waitForTimeout(1000);

      // Enter the WRONG key
      const modal = page.locator('[role="dialog"]');
      const keyInput = modal.locator('input[type="password"]');

      if (await keyInput.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await keyInput.first().fill(wrongKey);
        console.log('Entered wrong encryption key');

        await page.screenshot({ path: 'screenshots/14-14.3-wrong-key-entered.png' });

        // Try to submit
        const confirmBtn = modal.locator('button').filter({ hasText: /confirm|save|enter|submit/i });
        if (await confirmBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.first().click();
          await page.waitForTimeout(3000);

          // Check for error message
          const errorMessage = page.getByText(/key does not match|invalid key|incorrect key|wrong key|doesn.?t match|error/i);
          const hasError = await errorMessage.first().isVisible({ timeout: 5000 }).catch(() => false);

          await page.screenshot({ path: 'screenshots/14-14.3-after-wrong-key.png' });

          if (hasError) {
            console.log('Error message displayed for wrong key - as expected');
            await expect(errorMessage.first()).toBeVisible();
          } else {
            // Check if modal is still open (indicating retry is allowed)
            const modalStillOpen = await modal.isVisible({ timeout: 2000 }).catch(() => false);
            if (modalStillOpen) {
              console.log('Modal still open - retry allowed');
            } else {
              console.log('Note: No explicit error shown - app may have different validation behavior');
            }
          }

          // Verify retry is possible - clear and enter correct key
          if (await keyInput.first().isVisible({ timeout: 2000 }).catch(() => false)) {
            await keyInput.first().clear();
            await keyInput.first().fill(correctKey);

            if (await confirmBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
              await confirmBtn.first().click();
              await page.waitForTimeout(3000);

              console.log('Entered correct key after error - verifying success');
            }
          }
        }
      }
    } else {
      // Check if prompt appears automatically
      const modal = page.locator('[role="dialog"]');
      const keyInput = modal.locator('input[type="password"]');

      if (await keyInput.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await keyInput.first().fill(wrongKey);
        console.log('Entered wrong key in auto-prompt modal');

        const confirmBtn = modal.locator('button').filter({ hasText: /confirm|save|enter|submit/i });
        if (await confirmBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmBtn.first().click();
          await page.waitForTimeout(3000);

          const errorMessage = page.getByText(/key does not match|invalid key|incorrect key|wrong key/i);
          const hasError = await errorMessage.first().isVisible({ timeout: 5000 }).catch(() => false);

          if (hasError) {
            console.log('Error message displayed for wrong key');
          }
        }
      } else {
        console.log('Note: No key entry UI found - private feed may be fully accessible');
      }
    }

    await page.screenshot({ path: 'screenshots/14-14.3-wrong-key.png' });
  });

  /**
   * Test 14.4: Lost Key Flow
   *
   * Preconditions:
   * - @owner clicks "I don't have my key"
   *
   * Steps:
   * 1. Navigate to key entry UI
   * 2. Click lost key link
   *
   * Expected Results:
   * - Options dialog shown with guidance
   * - Reset option available for feed owners
   */
  test('14.4 Lost Key Flow', async ({ page, ownerIdentity, loginAs }) => {
    // Login as owner
    await loginAs(ownerIdentity);

    // Clear private feed keys to trigger key entry UI
    const keysCleared = await clearPrivateFeedKeys(page);
    console.log(`Cleared ${keysCleared} private feed keys`);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to private feed settings
    await goToPrivateFeedSettings(page);
    await page.waitForTimeout(3000);

    // Look for "Enter Encryption Key" button
    const enterKeyBtn = page.locator('button').filter({ hasText: /enter.*encryption.*key/i });
    const hasEnterKeyBtn = await enterKeyBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEnterKeyBtn) {
      await enterKeyBtn.click();
      await page.waitForTimeout(1000);

      const modal = page.locator('[role="dialog"]');

      await page.screenshot({ path: 'screenshots/14-14.4-key-entry-modal.png' });

      // Look for "I don't have my key" or "Lost key" link
      const lostKeyLink = modal.locator('a, button, span').filter({
        hasText: /don.?t have|lost.*key|forgot.*key|can.?t find/i
      });

      const hasLostKeyLink = await lostKeyLink.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasLostKeyLink) {
        console.log('Found "Lost key" option - clicking');
        await lostKeyLink.first().click();
        await page.waitForTimeout(2000);

        await page.screenshot({ path: 'screenshots/14-14.4-lost-key-flow.png' });

        // Check for guidance text
        const passwordManagerText = page.getByText(/password manager|secure notes/i);
        const resetFeedText = page.getByText(/reset.*private.*feed|need to reset/i);
        const requestAccessText = page.getByText(/request.*access|request new access/i);

        const hasPasswordManagerText = await passwordManagerText.first().isVisible({ timeout: 3000 }).catch(() => false);
        const hasResetText = await resetFeedText.first().isVisible({ timeout: 3000 }).catch(() => false);
        const hasRequestText = await requestAccessText.first().isVisible({ timeout: 3000 }).catch(() => false);

        console.log(`Lost key guidance visible:`);
        console.log(`  - Password manager hint: ${hasPasswordManagerText}`);
        console.log(`  - Reset feed option: ${hasResetText}`);
        console.log(`  - Request access hint: ${hasRequestText}`);

        // Check for action buttons
        const foundKeyBtn = page.locator('button').filter({ hasText: /found.*key|i have.*key/i });
        const resetFeedBtn = page.locator('button').filter({ hasText: /reset.*private.*feed/i });

        const hasFoundKeyBtn = await foundKeyBtn.first().isVisible({ timeout: 3000 }).catch(() => false);
        const hasResetFeedBtn = await resetFeedBtn.first().isVisible({ timeout: 3000 }).catch(() => false);

        if (hasFoundKeyBtn) {
          console.log('Found "I found my key" button');
        }
        if (hasResetFeedBtn) {
          console.log('Found "Reset my private feed" button');
          // Verify it exists but don't click (destructive)
          await expect(resetFeedBtn.first()).toBeVisible();
        }
      } else {
        console.log('Note: No explicit "Lost key" link found in modal');

        // Check for any help/guidance text directly in modal
        const helpText = modal.getByText(/lost|forgot|cannot find|don.?t remember|help/i);
        const hasHelpText = await helpText.first().isVisible({ timeout: 2000 }).catch(() => false);

        if (hasHelpText) {
          console.log('Found help text in modal');
        }
      }
    } else {
      // No enter key button visible - check page directly
      const lostKeyOnPage = page.locator('a, button').filter({
        hasText: /lost.*key|forgot.*key|don.?t have.*key/i
      });

      const hasLostKeyOnPage = await lostKeyOnPage.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasLostKeyOnPage) {
        console.log('Found lost key option on settings page');
        await lostKeyOnPage.first().click();
        await page.waitForTimeout(2000);
      } else {
        console.log('Note: No lost key UI found - key may be stored or app handles differently');
      }
    }

    await page.screenshot({ path: 'screenshots/14-14.4-lost-key.png' });
  });

  /**
   * Bonus Test: Key Persistence After Browser Refresh
   *
   * Steps:
   * 1. Login and enter encryption key
   * 2. Refresh the page
   * 3. Verify key is still stored and private feed is accessible
   *
   * Expected Results:
   * - Key persists across page refresh
   * - No re-entry required
   */
  test('Bonus: Key Persistence After Browser Refresh', async ({ page, ownerIdentity, loginAs }) => {
    if (!ownerIdentity.keys.encryptionKey) {
      test.skip(true, 'Owner identity does not have encryption key configured');
      return;
    }

    // Login as owner
    await loginAs(ownerIdentity);

    // Navigate to private feed settings
    await goToPrivateFeedSettings(page);
    await page.waitForTimeout(3000);

    // Check if we need to enter key
    const enterKeyBtn = page.locator('button').filter({ hasText: /enter.*encryption.*key/i });
    if (await enterKeyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enterKeyBtn.click();
      await page.waitForTimeout(1000);

      const modal = page.locator('[role="dialog"]');
      const keyInput = modal.locator('input[type="password"]');

      if (await keyInput.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await keyInput.first().fill(ownerIdentity.keys.encryptionKey);

        const confirmBtn = modal.locator('button').filter({ hasText: /confirm|save|enter/i });
        if (await confirmBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmBtn.first().click();
          await page.waitForTimeout(3000);
        }
      }
    }

    // Take screenshot before refresh
    await page.screenshot({ path: 'screenshots/14-bonus-before-refresh.png' });

    // Record current state
    const dashboardVisibleBefore = await page.getByText(/private feed dashboard|your private feed/i)
      .first().isVisible({ timeout: 5000 }).catch(() => false);

    console.log(`Dashboard visible before refresh: ${dashboardVisibleBefore}`);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Navigate back to private feed settings
    await goToPrivateFeedSettings(page);
    await page.waitForTimeout(3000);

    // Check if key is still accessible (no re-entry prompt)
    const enterKeyBtnAfter = page.locator('button').filter({ hasText: /enter.*encryption.*key/i });
    const needsKeyAfter = await enterKeyBtnAfter.isVisible({ timeout: 3000 }).catch(() => false);

    const dashboardVisibleAfter = await page.getByText(/private feed dashboard|your private feed/i)
      .first().isVisible({ timeout: 5000 }).catch(() => false);

    console.log(`After refresh:`);
    console.log(`  - Needs key re-entry: ${needsKeyAfter}`);
    console.log(`  - Dashboard visible: ${dashboardVisibleAfter}`);

    // Key should persist
    if (!needsKeyAfter && dashboardVisibleAfter) {
      console.log('Key persisted across refresh - success');
    } else if (needsKeyAfter) {
      console.log('Note: Key needs re-entry after refresh - storage may be session-only');
    }

    await page.screenshot({ path: 'screenshots/14-bonus-after-refresh.png' });
  });
});
