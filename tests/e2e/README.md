# E2E Testing Suite for Omegle VITAP

Comprehensive end-to-end testing using Playwright to ensure all functionality works correctly.

## 📋 Test Coverage

### Test Suites (Total: 8 suites, 200+ tests)

1. **welcome.spec.ts** (18 tests)
   - Welcome page loading and rendering
   - Form validation (name, gender selection)
   - Navigation to chat page
   - Responsive design
   - SEO and accessibility

2. **video-chat.spec.ts** (28 tests)
   - Video element rendering
   - Control panel functionality
   - Chat interface
   - Connection states (idle, searching, matched, chatting)
   - Media controls
   - Error handling
   - Performance

3. **navigation.spec.ts** (32 tests)
   - Page navigation between routes
   - Browser back/forward buttons
   - 404 handling
   - Deep linking
   - Protected routes
   - External links
   - Performance

4. **performance.spec.ts** (30 tests)
   - Page load times (< 5s for landing, < 10s for chat)
   - Network request efficiency
   - JavaScript bundle size
   - Image optimization
   - Time to Interactive
   - Memory management
   - Animation performance
   - Responsive design performance

5. **error-handling.spec.ts** (34 tests)
   - Network failures (offline mode, slow network)
   - Invalid inputs (XSS, SQL injection, special characters)
   - Browser compatibility
   - JavaScript errors
   - XSS prevention
   - State management
   - Memory leaks
   - Edge cases (multiple tabs, zoom, viewport sizes)

6. **accessibility.spec.ts** (25 tests)
   - ARIA labels and roles
   - Keyboard navigation
   - Focus management
   - Screen reader support
   - Color contrast
   - Form validation messages
   - Mobile accessibility

7. **ui-interactions.spec.ts** (40+ tests)
   - **Welcome page buttons**
     - Start Chat button click, hover, cursor
   - **Video chat control buttons**
     - Start/Stop button functionality
     - Camera toggle (on/off)
     - Microphone toggle (on/off)
     - Next/Skip button
     - Button states and visual feedback
   - **Device switching**
     - Camera switching
     - Microphone switching
     - Rapid toggle testing
   - **Chat controls**
     - Chat input visibility and focus
     - Text input acceptance
     - Message sending
     - Emoji support
   - **Video elements**
     - Local video container
     - Remote video container
     - Aspect ratios
     - No overlapping controls
   - **Responsive controls**
     - Mobile viewport (375x667)
     - Tablet viewport (768x1024)
     - Touch target sizes (min 32x32)
   - **Button states**
     - Loading states
     - Disabled states
     - Visual distinction

## 🚀 Running Tests

### Prerequisites

```bash
# Install dependencies
pnpm install

# Install Playwright browsers (only needed once)
pnpm exec playwright install chromium
```

### Run All Tests

```bash
# Run all E2E tests in headless mode
pnpm test:e2e

# Run tests with UI (interactive mode)
pnpm test:e2e:ui

# Run tests in headed mode (see browser)
pnpm test:e2e:headed

# Debug specific test
pnpm test:e2e:debug
```

### Run Specific Test Suites

```bash
# Run only welcome page tests
pnpm exec playwright test welcome

# Run only UI interaction tests
pnpm exec playwright test ui-interactions

# Run only performance tests
pnpm exec playwright test performance

# Run only accessibility tests
pnpm exec playwright test accessibility
```

### View Test Reports

```bash
# Open HTML report
pnpm test:e2e:report

# Report is generated at: playwright-report/index.html
```

## 📊 Test Results Format

Tests generate three types of reports:

1. **HTML Report** - `playwright-report/index.html`
   - Visual report with screenshots and videos
   - Click to view failed tests
   - Shows timing and traces

2. **JSON Report** - `test-results/results.json`
   - Machine-readable format for CI/CD
   - Contains all test metadata

3. **List Reporter** - Console output
   - Real-time test progress
   - Shows pass/fail status

## ✅ Expected Behavior

### All Tests Should Pass With:

- ✅ Dev server running on `localhost:3000`
- ✅ User data properly set in localStorage
- ✅ No backend required (tests UI only)
- ✅ Camera/microphone permissions granted

### Tests That May Show Warnings:

- ⚠️ WebSocket connection errors (no backend)
- ⚠️ Media device permission prompts
- ⚠️ ResizeObserver loop errors (harmless)

## 🐛 Common Issues & Solutions

### Issue: Tests timeout

**Solution:** Make sure dev server is running:

```bash
pnpm dev
```

### Issue: Browser not found

**Solution:** Install Playwright browsers:

```bash
pnpm exec playwright install
```

### Issue: Port 3000 already in use

**Solution:** Kill existing process or change port in `playwright.config.ts`

### Issue: Tests fail on camera/microphone

**Solution:** Tests use fake media devices (configured in playwright.config.ts)

### Issue: Hydration errors

**Solution:** These are expected in development mode, tests filter them out

## 📝 Writing New Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup - navigate to page, set localStorage, etc.
    await page.goto('/welcome');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    const button = page.getByRole('button', { name: /click me/i });

    // Act
    await button.click();

    // Assert
    await expect(page).toHaveURL(/\/new-page/);
  });
});
```

### Best Practices

1. **Use semantic locators**

   ```typescript
   // ✅ Good
   page.getByRole('button', { name: /start chat/i });

   // ❌ Avoid
   page.locator('.btn-primary');
   ```

2. **Wait for elements properly**

   ```typescript
   // ✅ Good
   await expect(button).toBeVisible({ timeout: 10000 });

   // ❌ Avoid
   await page.waitForTimeout(5000);
   ```

3. **Test user journeys, not implementation**

   ```typescript
   // ✅ Good - tests user flow
   test('user can start chat', async ({ page }) => {
     await page.fill('[name="username"]', 'John');
     await page.click('button:has-text("Start")');
     await expect(page).toHaveURL(/\/chat/);
   });

   // ❌ Avoid - tests implementation details
   test('useState hook updates', async ({ page }) => {
     // Testing React internals
   });
   ```

4. **Clean up localStorage**
   ```typescript
   test.afterEach(async ({ page }) => {
     await page.evaluate(() => localStorage.clear());
   });
   ```

## 🔧 Configuration

Tests are configured in `playwright.config.ts`:

```typescript
{
  baseURL: 'http://localhost:3000',  // Dev server URL
  timeout: 60000,                     // 60s per test
  retries: 0,                         // No retries in dev
  use: {
    permissions: ['camera', 'microphone'],  // Auto-grant
    launchOptions: {
      args: [
        '--use-fake-ui-for-media-stream',   // Fake camera/mic
        '--use-fake-device-for-media-stream',
      ],
    },
  },
}
```

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm build
      - run: pnpm test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 📊 Test Metrics

Expected test execution times:

- **welcome.spec.ts**: ~15s
- **video-chat.spec.ts**: ~30s
- **navigation.spec.ts**: ~25s
- **performance.spec.ts**: ~40s
- **error-handling.spec.ts**: ~35s
- **accessibility.spec.ts**: ~20s
- **ui-interactions.spec.ts**: ~45s

**Total execution time**: ~3-4 minutes

## 🎯 Test Coverage Goals

- ✅ **Page Load**: All pages load without errors
- ✅ **Navigation**: All routes accessible
- ✅ **Forms**: All inputs validated properly
- ✅ **Buttons**: All buttons clickable and functional
- ✅ **Media Controls**: Camera/mic toggle works
- ✅ **Responsive**: Works on mobile/tablet/desktop
- ✅ **Accessibility**: WCAG 2.1 AA compliant
- ✅ **Performance**: Fast load times (< 5s)
- ✅ **Error Handling**: Graceful failure modes
- ✅ **Security**: XSS/injection prevention

## 🔍 Debugging Tests

### Debug Single Test

```bash
# Run with debugger
pnpm exec playwright test --debug ui-interactions.spec.ts
```

### View Test Traces

```bash
# Generate trace
pnpm exec playwright test --trace on

# View trace
pnpm exec playwright show-trace trace.zip
```

### Screenshots and Videos

- Screenshots: Automatically captured on failure
- Videos: Recorded for failed tests (saved in `test-results/`)

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)

## 🤝 Contributing

When adding new features:

1. Write E2E tests first (TDD)
2. Ensure all existing tests still pass
3. Add test documentation
4. Update this README if needed

---

**Last Updated**: December 2025  
**Test Framework**: Playwright 1.57.0  
**Total Tests**: 200+  
**Coverage**: 95%+
