import { test, expect } from './fixtures/extension.js';

/**
 * Smoke Test - Verify Extension Loads
 *
 * This test verifies that:
 * 1. The extension loads successfully
 * 2. We can navigate to the options page
 * 3. The basic page structure is present
 */

test.describe('Smoke Tests', () => {
  test('extension loads and options page is accessible', async ({ optionsPage, extensionId }) => {
    // Verify we got an extension ID
    expect(extensionId).toBeTruthy();
    expect(extensionId).toMatch(/^[a-z]{32}$/); // Chrome extension IDs are 32 lowercase letters

    console.log('Extension ID:', extensionId);

    // Verify options page loaded
    expect(optionsPage.url()).toContain('chrome-extension://');
    expect(optionsPage.url()).toContain('/options.html');

    // Verify page title
    const title = await optionsPage.title();
    expect(title).toContain('ChatGPT');

    // Verify basic page structure exists
    const mainContainer = optionsPage.locator('.container');
    await expect(mainContainer).toBeVisible();

    console.log('✓ Extension loaded successfully');
    console.log('✓ Options page accessible');
    console.log('✓ Basic page structure present');
  });

  test('default menu exists on fresh load', async ({ optionsPage }) => {
    // Verify menu list is visible
    const menuList = optionsPage.locator('#menu-list');
    await expect(menuList).toBeVisible();

    // Verify at least one menu item exists
    const menuItems = optionsPage.locator('.menu-item');
    await expect(menuItems).toHaveCount(1); // Default menu should exist

    // Verify menu detail panel exists (may be hidden if no menu selected)
    const menuDetailPanel = optionsPage.locator('.menu-detail-panel');
    await expect(menuDetailPanel).toBeVisible();

    console.log('✓ Default menu present');
  });
});
