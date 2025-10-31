const { test, expect, chromium } = require('@playwright/test');
const path = require('path');

/**
 * Reusable helper function to navigate to extension configuration page
 * Steps:
 * 1. Opens Chrome with the extension loaded
 * 2. Navigates to chrome://extensions
 * 3. Finds the extension and opens details
 * 4. Opens the configuration page
 *
 * @param {string} extensionName - The name of the extension to find
 * @returns {Promise<{browser, context, page, extensionId}>} Browser objects and extension ID
 */
async function navigateToExtensionConfig(extensionName = 'ChatGPT Custom Prompts') {
  const extensionPath = path.join(__dirname);

  // Step 1: Launch Chrome with the extension loaded
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  const page = await context.newPage();

  // Step 2: Navigate to chrome://extensions
  await page.goto('chrome://extensions');

  // Enable developer mode to see extension IDs
  const devModeToggle = page.locator('cr-toggle#devMode');
  await devModeToggle.click();
  await page.waitForTimeout(500); // Wait for UI to update

  // Step 3: Find the extension and get its ID
  const extensionCard = page.locator(`extensions-item`).filter({ hasText: extensionName });
  await expect(extensionCard).toBeVisible();

  const extensionId = await extensionCard.getAttribute('id');
  console.log(`✓ Found extension: ${extensionName} (ID: ${extensionId})`);

  // Step 4: Open the configuration page
  // Click the "Details" button
  const detailsButton = extensionCard.locator('#detailsButton');
  await detailsButton.click();

  console.log('✓ Opened extension details');

  // Wait for details page to load
  await page.waitForTimeout(1000);

  // Find and click the "Extension options" link by text
  const optionsLink = page.getByText('Extension options');
  await optionsLink.waitFor({ state: 'visible' });

  // Listen for new page (options may open in new tab)
  const pagePromise = context.waitForEvent('page');

  await optionsLink.click();

  console.log('✓ Clicked extension options');

  // Wait for the new page to open
  const optionsPage = await pagePromise;
  await optionsPage.waitForLoadState('domcontentloaded');

  console.log('✓ Navigated to configuration page');

  return {
    context,
    page: optionsPage,
    extensionId,
  };
}

test('extension configuration page has correct title', async () => {
  let context;

  try {
    // Use the reusable helper to navigate to the config page
    const result = await navigateToExtensionConfig('ChatGPT Custom Prompts');
    context = result.context;
    const page = result.page;

    // Step 5: Verify the title
    await expect(page).toHaveTitle('ChatGPT Custom Prompts - Configuration');
    console.log('✓ Page title validated successfully');

    // Additional validations
    await expect(page.locator('h1')).toHaveText('ChatGPT Custom Prompts');
    console.log('✓ H1 header validated successfully');

  } finally {
    // Cleanup
    if (context) {
      await context.close();
    }
  }
});
