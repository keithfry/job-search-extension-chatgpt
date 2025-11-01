import { test as base, chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Custom fixture for Chrome extension testing
 *
 * Provides:
 * - context: Browser context with extension loaded
 * - extensionId: The ID of the loaded extension
 * - optionsPage: Direct access to options.html page
 */
export const test = base.extend({
  context: async ({}, use) => {
    // Path to extension directory (project root)
    const extensionPath = path.resolve(__dirname, '../..');

    // Create a temporary user data directory for this test
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'playwright-chrome-'));

    // Launch browser with extension loaded
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false, // Extensions don't work in headless mode
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    await use(context);
    await context.close();

    // Clean up temp directory
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  },

  extensionId: async ({ context }, use) => {
    // Navigate to chrome://extensions to get the extension ID
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }

    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },

  optionsPage: async ({ context, extensionId }, use) => {
    // Get the first page or create new one
    const pages = context.pages();
    const page = pages.length > 0 ? pages[0] : await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.waitForLoadState('networkidle');

    // Add helper method to safely reload the options page
    page.reloadOptions = async () => {
      // Use goto with waitUntil to ensure page is ready
      await page.goto(`chrome-extension://${extensionId}/options.html`, {
        waitUntil: 'networkidle',
      });
      // Extra wait for extension to initialize
      await page.waitForTimeout(500);
    };

    await use(page);
  },
});

export { expect } from '@playwright/test';
