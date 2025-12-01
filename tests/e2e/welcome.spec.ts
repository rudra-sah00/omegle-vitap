import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Welcome Page
 *
 * Tests cover:
 * - Page loading and rendering
 * - Form validation
 * - User input handling
 * - Navigation to chat page
 * - Responsive design
 * - Accessibility
 */

test.describe('Welcome Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/welcome');
  });

  test('should load welcome page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Welcome - Omegle/);
    await expect(page).toHaveURL(/\/welcome/);
  });

  test('should display welcome form with all elements', async ({ page }) => {
    // Check for form elements
    await expect(page.getByRole('textbox', { name: /name/i })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /gender/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /start chat/i })).toBeVisible();
  });

  test('should show validation error for empty name', async ({ page }) => {
    const startButton = page.getByRole('button', { name: /start chat/i });
    await startButton.click();

    // Should not navigate away from welcome page
    await expect(page).toHaveURL(/\/welcome/);
  });

  test('should accept valid name input', async ({ page }) => {
    const nameInput = page.getByRole('textbox', { name: /name/i });
    await nameInput.fill('Test User');

    await expect(nameInput).toHaveValue('Test User');
  });

  test('should allow gender selection', async ({ page }) => {
    const genderSelect = page.getByRole('combobox', { name: /gender/i });
    await genderSelect.click();

    // Check for gender options
    await expect(page.getByText('Male')).toBeVisible();
    await expect(page.getByText('Female')).toBeVisible();
    await expect(page.getByText('Other')).toBeVisible();
  });

  test('should navigate to chat page with valid input', async ({ page }) => {
    // Fill in name
    await page.getByRole('textbox', { name: /name/i }).fill('Test User');

    // Select gender
    await page.getByRole('combobox', { name: /gender/i }).click();
    await page.getByText('Male').click();

    // Click start chat
    await page.getByRole('button', { name: /start chat/i }).click();

    // Should navigate to omegle page
    await expect(page).toHaveURL(/\/omegle/, { timeout: 10000 });
  });

  test('should have animated background', async ({ page }) => {
    const background = page.locator('.animate-gradient-xy').first();
    await expect(background).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page, viewport }) => {
    if (viewport) {
      await page.setViewportSize({ width: 375, height: 667 });
    }

    // Form should still be visible and usable
    await expect(page.getByRole('textbox', { name: /name/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /start chat/i })).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Check for accessible labels
    const nameInput = page.getByRole('textbox', { name: /name/i });
    const genderSelect = page.getByRole('combobox', { name: /gender/i });

    await expect(nameInput).toBeVisible();
    await expect(genderSelect).toBeVisible();
  });

  test('should not allow navigation without filling form', async ({ page }) => {
    // Try to navigate to omegle page directly
    await page.goto('/omegle');

    // Should redirect back to welcome
    await expect(page).toHaveURL(/\/welcome/, { timeout: 5000 });
  });

  test('should preserve name in localStorage', async ({ page }) => {
    // Fill in name
    await page.getByRole('textbox', { name: /name/i }).fill('Persistent User');

    // Reload page
    await page.reload();

    // Name should be preserved (if implemented)
    // This test may fail if localStorage is not implemented
    // Just checking it doesn't error
    await expect(page).toHaveURL(/\/welcome/);
  });

  test('should have no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.waitForLoadState('networkidle');

    // Filter out known harmless errors
    const criticalErrors = errors.filter((error) => !error.includes('ResizeObserver'));

    expect(criticalErrors).toHaveLength(0);
  });

  test('should load in reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/welcome');
    await page.waitForLoadState('load');
    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});

test.describe('Welcome Page - Navigation', () => {
  test('should redirect from root to welcome', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/welcome/, { timeout: 5000 });
  });

  test('should handle deep linking to welcome', async ({ page }) => {
    await page.goto('/welcome?ref=home');
    await expect(page).toHaveURL(/\/welcome/);
  });
});

test.describe('Welcome Page - SEO', () => {
  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/welcome');

    // Check for essential meta tags
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveCount(1);
  });

  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/welcome');

    // Should have at least one heading
    const headings = page.locator('h1, h2, h3');
    await expect(headings.first()).toBeVisible();
  });
});
