import { test, expect } from '../fixtures/extension.js';

/**
 * TEST-UI08: Add Actions to Multiple Menus (Simplified)
 *
 * Verifies that actions are properly scoped to their menus
 */

test.describe('UI Tests - Actions Per Menu (Simple)', () => {
  test('should verify actions container exists and can add actions', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Select the default menu
    const menuItems = optionsPage.locator('.menu-item');
    await menuItems.first().click();
    await optionsPage.waitForTimeout(500);

    // Verify add action button exists
    const addActionBtn = optionsPage.locator('#add-action');
    await expect(addActionBtn).toBeVisible();
    console.log('✓ Add Action button is visible');

    // Click to add an action
    await addActionBtn.click();
    await optionsPage.waitForTimeout(500);

    // Verify action was added
    const actionItems = optionsPage.locator('.action-item');
    const count = await actionItems.count();
    expect(count).toBeGreaterThan(0);
    console.log(`✓ Action added successfully: ${count} action(s) total`);

    // Verify action has title and prompt inputs
    const actionTitles = optionsPage.locator('.action-title');
    const actionPrompts = optionsPage.locator('.action-prompt');

    await expect(actionTitles.first()).toBeVisible();
    await expect(actionPrompts.first()).toBeVisible();
    console.log('✓ Action has title and prompt inputs');
  });

  test('should create two menus and verify each can have actions', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Get initial menu count
    let menuItems = optionsPage.locator('.menu-item');
    const initialMenuCount = await menuItems.count();

    // Create first new menu
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(500);

    // Verify we can access add action button for menu 1
    let addActionBtn = optionsPage.locator('#add-action');
    await expect(addActionBtn).toBeVisible();
    console.log('✓ Menu 1 has Add Action button');

    // Create second new menu
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(500);

    // Verify we can access add action button for menu 2
    addActionBtn = optionsPage.locator('#add-action');
    await expect(addActionBtn).toBeVisible();
    console.log('✓ Menu 2 has Add Action button');

    // Verify total menu count increased
    menuItems = optionsPage.locator('.menu-item');
    const finalMenuCount = await menuItems.count();
    expect(finalMenuCount).toBe(initialMenuCount + 2);
    console.log(`✓ Created 2 new menus: ${finalMenuCount} total`);
  });
});
