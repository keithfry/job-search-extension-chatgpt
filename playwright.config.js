import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Chrome Extension testing
 *
 * Chrome extensions require special setup:
 * - Must use Chrome/Chromium browser
 * - Must load extension via launch options
 * - Cannot use regular page navigation for extension pages
 */
export default defineConfig({
  // Test directory
  testDir: './tests',

  // Maximum time one test can run
  timeout: 60 * 1000, // 60 seconds

  // Test execution settings
  fullyParallel: false, // Run tests in sequence for extension testing
  forbidOnly: !!process.env.CI, // Fail if test.only in CI
  retries: process.env.CI ? 2 : 0, // Retry failed tests in CI
  workers: 1, // Use single worker for extension testing

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['list'], // Console output
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  // Shared settings for all tests
  use: {
    // Base URL for extension pages (will be set dynamically per test)
    // Extension URLs are chrome-extension://<id>/page.html

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Record video on failure
    video: 'retain-on-failure',

    // Trace on first retry
    trace: 'on-first-retry',

    // Slower action execution for debugging
    // actionTimeout: 10000,
  },

  // Configure projects for different test scenarios
  projects: [
    {
      name: 'chromium-extension',
      use: {
        ...devices['Desktop Chrome'],
        // Extension-specific launch options will be added in test fixtures
        // We cannot set them here as we need dynamic extension path
      },
    },
  ],

  // Output folder for test artifacts
  outputDir: 'test-results/artifacts',
});
