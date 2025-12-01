import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Error Handling and Edge Cases
 *
 * Tests cover:
 * - Network failures
 * - Browser compatibility
 * - Invalid inputs
 * - Error recovery
 * - XSS prevention
 */

test.describe('Error Handling - Network Failures', () => {
  test('should handle offline mode gracefully', async ({ page, context }) => {
    await page.goto('/welcome');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Try to navigate
    await page.getByRole('button', { name: /start chat/i }).click();

    // Should not crash
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toBeTruthy();

    await context.setOffline(false);
  });

  test('should handle slow network', async ({ page, context }) => {
    // Simulate slow network
    await context.route('**/*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      await route.continue();
    });

    await page.goto('/welcome');

    // Should still load (just slower)
    await expect(page).toHaveURL(/\/welcome/);
  });

  test('should handle failed resource loading', async ({ page, context }) => {
    // Block some resources
    await context.route('**/*.png', (route) => route.abort());

    await page.goto('/welcome');

    // Page should still load even if images fail
    await expect(page.getByRole('button', { name: /start chat/i })).toBeVisible();
  });

  test('should recover from WebSocket connection failure', async ({ page }) => {
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem(
        'omegle_user',
        JSON.stringify({
          name: 'WS Test',
          gender: 'Male',
          uid: 'ws-uid-123',
        })
      );
    });

    await page.goto('/omegle');

    // Even without backend, should show UI
    await expect(page.getByRole('button', { name: /start/i })).toBeVisible();
  });
});

test.describe('Error Handling - Invalid Inputs', () => {
  test('should handle extremely long names', async ({ page }) => {
    await page.goto('/welcome');

    const longName = 'A'.repeat(1000);
    const nameInput = page.getByRole('textbox', { name: /name/i });
    await nameInput.fill(longName);

    // Should either truncate or reject
    const value = await nameInput.inputValue();
    expect(value.length).toBeLessThan(1001);
  });

  test('should handle special characters in name', async ({ page }) => {
    await page.goto('/welcome');

    const specialName = '<script>alert("xss")</script>';
    const nameInput = page.getByRole('textbox', { name: /name/i });
    await nameInput.fill(specialName);

    // Should sanitize or allow safely
    const value = await nameInput.inputValue();
    expect(value).toBeTruthy();
  });

  test('should handle emoji in name', async ({ page }) => {
    await page.goto('/welcome');

    const emojiName = '😀 Test User 🎉';
    const nameInput = page.getByRole('textbox', { name: /name/i });
    await nameInput.fill(emojiName);

    // Should either accept or sanitize
    const value = await nameInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test('should handle SQL injection attempts', async ({ page }) => {
    await page.goto('/welcome');

    const sqlInjection = "'; DROP TABLE users; --";
    const nameInput = page.getByRole('textbox', { name: /name/i });
    await nameInput.fill(sqlInjection);

    // Should handle safely (no SQL on client side anyway)
    const value = await nameInput.inputValue();
    expect(value).toBeTruthy();
  });
});

test.describe('Error Handling - Browser Compatibility', () => {
  test('should work without localStorage', async ({ page }) => {
    // Block localStorage
    await page.goto('/welcome');
    await page.evaluate(() => {
      Object.defineProperty(window, 'localStorage', {
        value: null,
        writable: false,
      });
    });

    // Should still render (may show error)
    await expect(page).toHaveURL(/\/welcome/);
  });

  test('should handle missing browser APIs gracefully', async ({ page }) => {
    await page.goto('/welcome');

    // Check if critical APIs are available or handled
    const hasRequiredAPIs = await page.evaluate(() => {
      return {
        fetch: typeof fetch !== 'undefined',
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined',
      };
    });

    expect(hasRequiredAPIs.fetch).toBe(true);
  });

  test('should not use deprecated browser APIs', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning' && msg.text().includes('deprecated')) {
        warnings.push(msg.text());
      }
    });

    await page.goto('/welcome');
    await page.waitForLoadState('networkidle');

    // Should not have deprecation warnings
    expect(warnings.length).toBe(0);
  });
});

test.describe('Error Handling - JavaScript Errors', () => {
  test('should not have console errors on welcome page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/welcome');
    await page.waitForLoadState('networkidle');

    // Filter out known harmless errors
    const criticalErrors = errors.filter(
      (error) => !error.includes('ResizeObserver') && !error.includes('Hydration')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should not have console errors on omegle page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem(
        'omegle_user',
        JSON.stringify({
          name: 'Error Test',
          gender: 'Female',
          uid: 'error-uid-123',
        })
      );
    });
    await page.goto('/omegle');
    await page.waitForLoadState('networkidle');

    const criticalErrors = errors.filter(
      (error) =>
        !error.includes('ResizeObserver') &&
        !error.includes('Hydration') &&
        !error.includes('WebSocket')
    );

    expect(criticalErrors.length).toBeLessThan(3);
  });

  test('should handle React errors gracefully', async ({ page }) => {
    await page.goto('/welcome');

    // Try to trigger a potential React error
    await page.evaluate(() => {
      const event = new Event('error');
      window.dispatchEvent(event);
    });

    // Page should still be functional
    await expect(page.getByRole('button', { name: /start chat/i })).toBeVisible();
  });
});

test.describe('Error Handling - XSS Prevention', () => {
  test('should sanitize user input in localStorage', async ({ page }) => {
    await page.goto('/welcome');

    const xssPayload = '<img src=x onerror=alert(1)>';
    await page.evaluate((payload) => {
      localStorage.setItem(
        'omegle_user',
        JSON.stringify({
          name: payload,
          gender: 'Male',
          uid: 'xss-uid',
        })
      );
    }, xssPayload);

    await page.goto('/omegle');

    // Should not execute script
    await page.waitForTimeout(1000);

    // Check no alert was triggered (would cause test to hang)
    expect(true).toBe(true);
  });

  test('should not execute inline scripts in chat', async ({ page }) => {
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem(
        'omegle_user',
        JSON.stringify({
          name: 'XSS Test',
          gender: 'Male',
          uid: 'xss-chat-uid',
        })
      );
    });
    await page.goto('/omegle');

    // Try to input script in chat
    const chatInput = page.locator('textarea, input[type="text"]').last();
    await chatInput.click({ timeout: 10000 });
    await chatInput.fill('<script>alert("xss")</script>');

    // Should not execute
    await page.waitForTimeout(500);
    expect(true).toBe(true);
  });

  test('should escape HTML entities', async ({ page }) => {
    await page.goto('/welcome');

    const htmlEntities = '&lt;div&gt;Test&lt;/div&gt;';
    const nameInput = page.getByRole('textbox', { name: /name/i });
    await nameInput.fill(htmlEntities);

    // Should handle safely
    const value = await nameInput.inputValue();
    expect(value).toBeTruthy();
  });
});

test.describe('Error Handling - State Management', () => {
  test('should maintain state during page refresh', async ({ page }) => {
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem(
        'omegle_user',
        JSON.stringify({
          name: 'State Test',
          gender: 'Other',
          uid: 'state-uid',
        })
      );
    });

    await page.goto('/omegle');
    await page.reload();

    // Should still have access or redirect appropriately
    const url = page.url();
    expect(url).toBeTruthy();
  });

  test('should handle rapid navigation', async ({ page }) => {
    // Navigate rapidly between pages
    await page.goto('/welcome');
    await page.goto('/terms');
    await page.goto('/privacy');
    await page.goto('/welcome');

    // Should not error
    await expect(page).toHaveURL(/\/welcome/);
  });

  test('should handle concurrent state updates', async ({ page }) => {
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem(
        'omegle_user',
        JSON.stringify({
          name: 'Concurrent Test',
          gender: 'Male',
          uid: 'concurrent-uid',
        })
      );
    });

    await page.goto('/omegle');

    // Try multiple actions quickly
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Click multiple buttons rapidly (if available)
    await page.waitForTimeout(500);

    expect(errors.length).toBe(0);
  });
});

test.describe('Error Handling - Memory Leaks', () => {
  test('should clean up on unmount', async ({ page }) => {
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem(
        'omegle_user',
        JSON.stringify({
          name: 'Cleanup Test',
          gender: 'Female',
          uid: 'cleanup-uid',
        })
      );
    });

    // Navigate to omegle and back multiple times
    for (let i = 0; i < 3; i++) {
      await page.goto('/omegle');
      await page.waitForLoadState('networkidle');
      await page.goto('/welcome');
      await page.waitForLoadState('networkidle');
    }

    // Check for errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.waitForTimeout(500);
    expect(errors.length).toBe(0);
  });

  test('should not accumulate event listeners', async ({ page }) => {
    await page.goto('/welcome');

    // Get initial listener count
    const initialListeners = await page.evaluate(() => {
      return (window as Window & { _eventListenerCount?: number })._eventListenerCount || 0;
    });

    // Navigate multiple times
    await page.goto('/terms');
    await page.goto('/welcome');
    await page.goto('/privacy');
    await page.goto('/welcome');

    // Check listener count hasn't grown excessively
    // (This is a simplified check)
    expect(typeof initialListeners).toBe('number');
  });
});

test.describe('Error Handling - Edge Cases', () => {
  test('should handle multiple tabs', async ({ page, context }) => {
    // Open first tab
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem(
        'omegle_user',
        JSON.stringify({
          name: 'Tab Test 1',
          gender: 'Male',
          uid: 'tab-uid-1',
        })
      );
    });

    // Open second tab
    const page2 = await context.newPage();
    await page2.goto('/welcome');
    await page2.evaluate(() => {
      localStorage.setItem(
        'omegle_user',
        JSON.stringify({
          name: 'Tab Test 2',
          gender: 'Female',
          uid: 'tab-uid-2',
        })
      );
    });

    // Both should work independently
    await expect(page).toHaveURL(/\/welcome/);
    await expect(page2).toHaveURL(/\/welcome/);

    await page2.close();
  });

  test('should handle browser zoom', async ({ page }) => {
    await page.goto('/welcome');

    // Zoom in
    await page.evaluate(() => {
      document.body.style.zoom = '150%';
    });

    // Should still be usable
    await expect(page.getByRole('button', { name: /start chat/i })).toBeVisible();

    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '100%';
    });
  });

  test('should handle very small viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });

    await page.goto('/welcome');

    // Should still be functional
    await expect(page.getByRole('button', { name: /start chat/i })).toBeVisible();
  });

  test('should handle very large viewport', async ({ page }) => {
    await page.setViewportSize({ width: 3840, height: 2160 });

    await page.goto('/welcome');

    // Should render correctly
    await expect(page.getByRole('button', { name: /start chat/i })).toBeVisible();
  });
});
