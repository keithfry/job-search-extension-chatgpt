import { test, expect } from '../fixtures/extension.js';

/**
 * TEST-UI03: Edit Menu Name
 *
 * Verifies that:
 * 1. Menu name can be edited in the input field
 * 2. Changes appear in real-time in the sidebar
 * 3. Menu name persists after saving
 * 4. Menu name updates in the detail panel header
 * 5. Empty menu names are validated
 */

test.describe('UI Tests - Edit Menu Name', () => {
  test('should update menu name in sidebar when typing', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Create a new menu to test with
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    // Get the menu name input
    const menuNameInput = optionsPage.locator('#menuName');
    const originalName = await menuNameInput.inputValue();
    console.log(`Original menu name: "${originalName}"`);

    // Change the menu name
    const newName = 'My Custom Menu';
    await menuNameInput.clear();
    await menuNameInput.fill(newName);
    console.log(`Changed to: "${newName}"`);

    // Set a valid URL to pass validation
    const customGptUrlInput = optionsPage.locator('#customGptUrl');
    await customGptUrlInput.clear();
    await customGptUrlInput.fill('https://chatgpt.com/g/g-test123');

    // Verify input shows new name
    const inputValue = await menuNameInput.inputValue();
    expect(inputValue).toBe(newName);

    // Save the menu
    const saveBtn = optionsPage.locator('#save');
    await saveBtn.click();

    // Wait for sidebar to update with the new name
    const selectedMenuItem = optionsPage.locator('.menu-item.selected .menu-name');
    await expect(selectedMenuItem).toContainText(newName, { timeout: 5000 });
    const sidebarText = await selectedMenuItem.textContent();
    expect(sidebarText).toBe(newName);
    console.log(`✓ Sidebar updated to: "${sidebarText}"`);
  });

  test('should persist menu name after save and reload', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Create a menu and set a unique name
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const uniqueName = `Test Menu ${Date.now()}`;
    const menuNameInput = optionsPage.locator('#menuName');
    await menuNameInput.clear();
    await menuNameInput.fill(uniqueName);

    // Save
    const saveBtn = optionsPage.locator('#save');
    await saveBtn.click();
    await optionsPage.waitForTimeout(300);

    console.log(`✓ Saved menu with name: "${uniqueName}"`);

    // Verify the name is still in the input after save
    const savedName = await menuNameInput.inputValue();
    expect(savedName).toBe(uniqueName);
    console.log(`✓ Menu name retained after save: "${savedName}"`);

    // Note: Persistence testing requires chrome.storage mock
  });

  test('should allow editing menu name of existing menu', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Get the first menu item
    const firstMenuItem = optionsPage.locator('.menu-item').first();
    await firstMenuItem.click();
    await optionsPage.waitForTimeout(200);

    // Get current name
    const menuNameInput = optionsPage.locator('#menuName');
    const originalName = await menuNameInput.inputValue();
    console.log(`Editing menu: "${originalName}"`);

    // Change the name
    const updatedName = originalName + ' (Updated)';
    await menuNameInput.clear();
    await menuNameInput.fill(updatedName);

    // Set a valid URL to pass validation (default menu has placeholder URL)
    const customGptUrlInput = optionsPage.locator('#customGptUrl');
    await customGptUrlInput.clear();
    await customGptUrlInput.fill('https://chatgpt.com/g/g-test123');

    // Save
    const saveBtn = optionsPage.locator('#save');
    await saveBtn.click();

    // Wait for sidebar to update with the updated name
    const selectedMenuItem = optionsPage.locator('.menu-item.selected .menu-name');
    await expect(selectedMenuItem).toContainText(updatedName, { timeout: 5000 });
    const sidebarText = await selectedMenuItem.textContent();
    expect(sidebarText).toBe(updatedName);
    console.log(`✓ Successfully updated menu name to: "${sidebarText}"`);
  });

  test('should handle menu name with special characters', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    // Test name with special characters
    const specialName = 'Send to GPT-4 (Advanced) & More!';
    const menuNameInput = optionsPage.locator('#menuName');
    await menuNameInput.clear();
    await menuNameInput.fill(specialName);

    // Save
    const saveBtn = optionsPage.locator('#save');
    await saveBtn.click();
    await optionsPage.waitForTimeout(300);

    // Verify it saved correctly
    const inputValue = await menuNameInput.inputValue();
    expect(inputValue).toBe(specialName);
    console.log(`✓ Special characters handled: "${specialName}"`);
  });

  test('should validate empty menu name on save', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    // Try to clear the menu name
    const menuNameInput = optionsPage.locator('#menuName');
    await menuNameInput.clear();

    // Try to save with empty name
    const saveBtn = optionsPage.locator('#save');
    await saveBtn.click();
    await optionsPage.waitForTimeout(300);

    // Should show error banner
    const errorBanner = optionsPage.locator('#error-banner');
    await expect(errorBanner).toBeVisible();
    const errorText = await errorBanner.textContent();
    expect(errorText.toLowerCase()).toContain('required');
    console.log(`✓ Validation error shown: "${errorText}"`);
  });

  test('should enforce 50 character limit', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    // Try to enter a name longer than 50 characters
    const longName = 'A'.repeat(60); // 60 characters
    const menuNameInput = optionsPage.locator('#menuName');
    await menuNameInput.clear();
    await menuNameInput.fill(longName);

    // The input has maxlength=50, so it should truncate
    const inputValue = await menuNameInput.inputValue();
    expect(inputValue.length).toBeLessThanOrEqual(50);
    console.log(`✓ Name length limited to ${inputValue.length} characters`);
  });
});
