import { test as base, chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

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

    // Launch browser with extension loaded
    const context = await chromium.launchPersistentContext('', {
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
    // Open the options page
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await use(page);
  },
});

export { expect } from '@playwright/test';
