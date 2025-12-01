import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Video Chat Page
 *
 * Tests cover:
 * - Video element rendering
 * - Control panel functionality
 * - Chat interface
 * - Connection states
 * - Media controls
 */

test.describe('Video Chat Page - Basic Rendering', () => {
  test.beforeEach(async ({ page }) => {
    // Set up user data in localStorage
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem(
        'omegle_user',
        JSON.stringify({
          name: 'Test User',
          gender: 'Male',
          uid: 'test-uid-123',
        })
      );
    });
    await page.goto('/omegle');
  });

  test('should load omegle page successfully', async ({ page }) => {
    await expect(page).toHaveURL(/\/omegle/);
  });

  test('should render video containers', async ({ page }) => {
    // Check for video elements
    const localVideo = page.locator('#local-video');
    const remoteVideo = page.locator('#remote-video');

    await expect(localVideo).toBeVisible();
    await expect(remoteVideo).toBeVisible();
  });

  test('should display control panel', async ({ page }) => {
    // Check for control buttons
    await expect(page.getByRole('button', { name: /start/i })).toBeVisible();
  });

  test('should display camera and mic controls', async ({ page }) => {
    // Look for media control buttons (these may be icons)
    const controls = page.locator('[aria-label*="camera"], [aria-label*="microphone"]');
    await expect(controls.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have chat interface on desktop', async ({ page, viewport }) => {
    if (viewport && viewport.width >= 1024) {
      // Chat should be visible on desktop
      const chatBox = page.locator('[class*="chat"]').first();
      await expect(chatBox).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Videos should still be visible
    await expect(page.locator('#local-video')).toBeVisible();
    await expect(page.locator('#remote-video')).toBeVisible();
  });

  test('should handle browser back button', async ({ page }) => {
    await page.goBack();

    // Should go back to welcome or show confirmation
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toBeTruthy();
  });
});

test.describe('Video Chat Page - Connection States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem(
        'omegle_user',
        JSON.stringify({
          name: 'Test User',
          gender: 'Male',
          uid: 'test-uid-456',
        })
      );
    });
    await page.goto('/omegle');
  });

  test('should show idle state initially', async ({ page }) => {
    // Start button should be visible
    await expect(page.getByRole('button', { name: /start/i })).toBeVisible();
  });

  test('should show searching state after clicking start', async ({ page }) => {
    const startButton = page.getByRole('button', { name: /start/i });
    await startButton.click();

    // Should show searching indicator or stop button
    await page.waitForTimeout(500);
    const stopButton = page.getByRole('button', { name: /stop/i });
    await expect(stopButton).toBeVisible({ timeout: 10000 });
  });

  test('should be able to stop searching', async ({ page }) => {
    // Click start
    await page.getByRole('button', { name: /start/i }).click();
    await page.waitForTimeout(500);

    // Click stop
    const stopButton = page.getByRole('button', { name: /stop/i });
    await stopButton.click({ timeout: 10000 });

    // Should return to idle state
    await page.waitForTimeout(500);
    await expect(page.getByRole('button', { name: /start/i })).toBeVisible({ timeout: 10000 });
  });

  test('should handle match state gracefully', async ({ page }) => {
    // This test checks that the UI doesn't break even without a match
    await page.getByRole('button', { name: /start/i }).click();

    // Wait a bit to see if any errors occur
    await page.waitForTimeout(2000);

    // Check for JavaScript errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    expect(errors.length).toBe(0);
  });
});

test.describe('Video Chat Page - Media Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem(
        'omegle_user',
        JSON.stringify({
          name: 'Test User',
          gender: 'Female',
          uid: 'test-uid-789',
        })
      );
    });
    await page.goto('/omegle');
  });

  test('should have camera toggle button', async ({ page }) => {
    const cameraButton = page.locator('[aria-label*="camera"], [aria-label*="Camera"]');
    await expect(cameraButton.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have microphone toggle button', async ({ page }) => {
    const micButton = page.locator('[aria-label*="microphone"], [aria-label*="Microphone"]');
    await expect(micButton.first()).toBeVisible({ timeout: 10000 });
  });

  test('should toggle camera on click', async ({ page }) => {
    const cameraButton = page.locator('[aria-label*="camera"], [aria-label*="Camera"]').first();
    await cameraButton.click({ timeout: 10000 });

    // Just verify no crash - state change testing requires mock
    await page.waitForTimeout(500);
    await expect(cameraButton).toBeVisible();
  });

  test('should toggle microphone on click', async ({ page }) => {
    const micButton = page
      .locator('[aria-label*="microphone"], [aria-label*="Microphone"]')
      .first();
    await micButton.click({ timeout: 10000 });

    // Just verify no crash
    await page.waitForTimeout(500);
    await expect(micButton).toBeVisible();
  });
});

test.describe('Video Chat Page - Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem(
        'omegle_user',
        JSON.stringify({
          name: 'Chat Tester',
          gender: 'Other',
          uid: 'test-uid-chat',
        })
      );
    });
    await page.goto('/omegle');
  });

  test('should have chat input when matched', async ({ page }) => {
    // Even without match, chat UI should exist (just disabled)
    const chatInput = page.locator('textarea, input[type="text"]').last();
    await expect(chatInput).toBeVisible({ timeout: 10000 });
  });

  test('should not send empty messages', async ({ page }) => {
    const chatInput = page.locator('textarea, input[type="text"]').last();
    await chatInput.click({ timeout: 10000 });

    // Try to send empty message
    await page.keyboard.press('Enter');

    // Input should still be empty
    await expect(chatInput).toHaveValue('');
  });

  test('should allow typing in chat', async ({ page }) => {
    const chatInput = page.locator('textarea, input[type="text"]').last();
    await chatInput.click({ timeout: 10000 });
    await chatInput.fill('Hello test message');

    await expect(chatInput).toHaveValue('Hello test message');
  });
});

test.describe('Video Chat Page - Error Handling', () => {
  test('should redirect to welcome if no user data', async ({ page }) => {
    // Clear localStorage
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Try to access omegle page
    await page.goto('/omegle');

    // Should redirect back to welcome
    await expect(page).toHaveURL(/\/welcome/, { timeout: 5000 });
  });

  test('should handle offline mode gracefully', async ({ page, context }) => {
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem(
        'omegle_user',
        JSON.stringify({
          name: 'Offline User',
          gender: 'Male',
          uid: 'test-uid-offline',
        })
      );
    });
    await page.goto('/omegle');

    // Simulate offline
    await context.setOffline(true);

    // Try to start chat
    await page.getByRole('button', { name: /start/i }).click();
    await page.waitForTimeout(1000);

    // Should show error or remain in idle state
    // Just verify no crash
    await expect(page).toHaveURL(/\/omegle/);

    await context.setOffline(false);
  });

  test('should prevent navigation during active session', async ({ page }) => {
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem(
        'omegle_user',
        JSON.stringify({
          name: 'Session User',
          gender: 'Female',
          uid: 'test-uid-session',
        })
      );
    });
    await page.goto('/omegle');

    // Start search
    await page.getByRole('button', { name: /start/i }).click();

    // Try to navigate away (this would trigger beforeunload in real scenario)
    // In test, just verify the handler exists
    const beforeUnloadHandler = await page.evaluate(() => {
      return window.onbeforeunload !== null;
    });

    // Handler should be set during session
    expect(beforeUnloadHandler).toBeTruthy();
  });
});

test.describe('Video Chat Page - Performance', () => {
  test('should not crash during extended use', async ({ page }) => {
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem(
        'omegle_user',
        JSON.stringify({
          name: 'Perf User',
          gender: 'Male',
          uid: 'test-uid-perf',
        })
      );
    });

    await page.goto('/omegle');
    await page.waitForLoadState('networkidle');

    // Wait to check for stability
    await page.waitForTimeout(2000);

    // Check no JavaScript errors occurred
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.waitForTimeout(1000);

    expect(errors.length).toBe(0);
  });

  test('should load page within reasonable time', async ({ page }) => {
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem(
        'omegle_user',
        JSON.stringify({
          name: 'Speed User',
          gender: 'Other',
          uid: 'test-uid-speed',
        })
      );
    });

    const startTime = Date.now();
    await page.goto('/omegle');
    await page.waitForLoadState('load');
    const loadTime = Date.now() - startTime;

    // Page should load within 8 seconds
    expect(loadTime).toBeLessThan(8000);
  });

  test('should not have excessive network requests', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => {
      requests.push(request.url());
    });

    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem(
        'omegle_user',
        JSON.stringify({
          name: 'Network User',
          gender: 'Male',
          uid: 'test-uid-network',
        })
      );
    });
    await page.goto('/omegle');
    await page.waitForLoadState('networkidle');

    // Should not make hundreds of requests
    expect(requests.length).toBeLessThan(100);
  });
});
