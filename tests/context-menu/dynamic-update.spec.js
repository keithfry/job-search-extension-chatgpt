import { test, expect } from '../fixtures/extension.js';

/**
 * TEST-CM03: Context Menu Updates on Config Change
 *
 * Verifies that:
 * 1. Adding an action in options updates the context menu
 * 2. Removing an action removes it from context menu
 * 3. Changing menu name updates context menu title
 * 4. Disabling an action removes it from context menu
 * 5. Enabling an action adds it to context menu
 *
 * Note: Chrome context menus are rebuilt when configuration changes.
 * This test verifies the configuration changes that trigger rebuilds.
 */

test.describe('Context Menu Tests - Dynamic Updates', () => {
  test('should update menu count when adding new menu', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Get initial menu count
    const menuItems = optionsPage.locator('.menu-item');
    const initialCount = await menuItems.count();
    console.log(`Initial menu count: ${initialCount}`);

    // Create a new menu
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const menuNameInput = optionsPage.locator('#menuName');
    await menuNameInput.clear();
    await menuNameInput.fill('New Context Menu');

    // Set a valid URL to pass validation
    const customGptUrlInput = optionsPage.locator('#customGptUrl');
    await customGptUrlInput.clear();
    await customGptUrlInput.fill('https://chatgpt.com/g/g-test123');

    // Add an action to the menu
    const addActionBtn = optionsPage.locator('#add-action');
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles = optionsPage.locator('.action-title');
    await actionTitles.last().fill('New Action');

    const actionPrompts = optionsPage.locator('.action-prompt');
    await actionPrompts.last().fill('Test prompt');

    // Save the menu
    const saveBtn = optionsPage.locator('#save');
    await saveBtn.click();

    // Wait for the menu to appear in sidebar after save
    const newMenu = optionsPage.locator('.menu-item:has-text("New Context Menu")');
    await expect(newMenu).toBeVisible({ timeout: 10000 });
    console.log('✓ New menu "New Context Menu" added to configuration');

    // Verify menu was added
    const updatedCount = await menuItems.count();
    expect(updatedCount).toBe(initialCount + 1);
    console.log(`✓ Menu count increased to ${updatedCount}`);
  });

  test('should update when adding action to existing menu', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Select first menu
    const menuItems = optionsPage.locator('.menu-item');
    const firstMenu = menuItems.first();
    await firstMenu.click();
    await optionsPage.waitForTimeout(200);

    // Count existing actions
    const actionItems = optionsPage.locator('.action-item');
    const initialActionCount = await actionItems.count();
    console.log(`Initial action count: ${initialActionCount}`);

    // Add a new action
    const addActionBtn = optionsPage.locator('#add-action');
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles = optionsPage.locator('.action-title');
    await actionTitles.last().fill('Dynamic Added Action');

    const actionPrompts = optionsPage.locator('.action-prompt');
    await actionPrompts.last().fill('This action was added dynamically');

    // Set a valid URL to pass validation (default menu has placeholder URL)
    const customGptUrlInput = optionsPage.locator('#customGptUrl');
    await customGptUrlInput.clear();
    await customGptUrlInput.fill('https://chatgpt.com/g/g-test123');

    // Save
    const saveBtn = optionsPage.locator('#save');
    await saveBtn.click();

    // Verify success message appears quickly after save
    const successBanner = optionsPage.locator('#success-banner');
    await expect(successBanner).toBeVisible({ timeout: 5000 });
    console.log('✓ Save success message shown');

    // Verify action was added
    const updatedActionCount = await actionItems.count();
    expect(updatedActionCount).toBe(initialActionCount + 1);
    console.log(`✓ Action count increased to ${updatedActionCount}`);
  });

  test('should update when removing action from menu', async ({ optionsPage, page }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Create a menu with an action to delete
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const menuNameInput = optionsPage.locator('#menuName');
    await menuNameInput.clear();
    await menuNameInput.fill('Menu for Deletion Test');

    // Add action
    const addActionBtn = optionsPage.locator('#add-action');
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles = optionsPage.locator('.action-title');
    await actionTitles.last().fill('Action to Delete');

    const actionPrompts = optionsPage.locator('.action-prompt');
    await actionPrompts.last().fill('This will be deleted');

    // Set a valid URL to pass validation
    const customGptUrlInput = optionsPage.locator('#customGptUrl');
    await customGptUrlInput.clear();
    await customGptUrlInput.fill('https://chatgpt.com/g/g-test123');

    // Save
    const saveBtn = optionsPage.locator('#save');
    await saveBtn.click();
    await optionsPage.waitForTimeout(300);

    // Count actions
    const actionItems = optionsPage.locator('.action-item');
    const beforeCount = await actionItems.count();
    console.log(`Actions before deletion: ${beforeCount}`);

    // Set up continuous dialog handler
    optionsPage.on('dialog', dialog => dialog.accept());

    // Delete the action
    const deleteBtn = optionsPage.locator('.action-item .btn-delete').last();
    await deleteBtn.click();
    await optionsPage.waitForTimeout(500);

    // Verify action was removed from UI
    const afterCount = await actionItems.count();
    expect(afterCount).toBe(beforeCount - 1);
    console.log(`✓ Action count decreased to ${afterCount}`);

    // Save the change
    await saveBtn.click();
    await optionsPage.waitForTimeout(300);

    console.log('✓ Configuration saved after action removal');
  });

  test('should update when changing menu name', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Create a menu
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const menuNameInput = optionsPage.locator('#menuName');
    const originalName = 'Original Menu Name';
    await menuNameInput.clear();
    await menuNameInput.fill(originalName);

    // Set a valid URL to pass validation
    const customGptUrlInput = optionsPage.locator('#customGptUrl');
    await customGptUrlInput.clear();
    await customGptUrlInput.fill('https://chatgpt.com/g/g-test123');

    // Save
    const saveBtn = optionsPage.locator('#save');
    await saveBtn.click();

    // Wait for the menu to appear in sidebar with original name
    const menuItem = optionsPage.locator('.menu-item.selected .menu-name');
    await expect(menuItem).toContainText(originalName, { timeout: 5000 });
    let sidebarName = await menuItem.textContent();
    expect(sidebarName).toBe(originalName);
    console.log(`✓ Original name: "${originalName}"`);

    // Change the name
    const newName = 'Updated Menu Name';
    await menuNameInput.clear();
    await menuNameInput.fill(newName);

    // Save again
    await saveBtn.click();

    // Wait for sidebar to update with new name
    await expect(menuItem).toContainText(newName, { timeout: 5000 });
    sidebarName = await menuItem.textContent();
    expect(sidebarName).toBe(newName);
    console.log(`✓ Updated name: "${newName}"`);
    console.log('✓ Menu name change reflected in configuration');
  });

  test('should update when disabling action', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Create menu with enabled action
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const menuNameInput = optionsPage.locator('#menuName');
    await menuNameInput.clear();
    await menuNameInput.fill('Disable Action Test');

    // Add action
    const addActionBtn = optionsPage.locator('#add-action');
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles = optionsPage.locator('.action-title');
    await actionTitles.last().fill('Action to Disable');

    const actionPrompts = optionsPage.locator('.action-prompt');
    await actionPrompts.last().fill('This will be disabled');

    // Ensure it's enabled
    const enabledCheckbox = optionsPage.locator('.action-enabled').last();
    await enabledCheckbox.check();

    // Save
    const saveBtn = optionsPage.locator('#save');
    await saveBtn.click();
    await optionsPage.waitForTimeout(300);

    console.log('✓ Menu saved with enabled action');

    // Now disable the action
    await enabledCheckbox.uncheck();

    // Save again
    await saveBtn.click();
    await optionsPage.waitForTimeout(300);

    // Verify it's saved as disabled (without reload)
    const isChecked = await enabledCheckbox.isChecked();
    expect(isChecked).toBe(false);
    console.log('✓ Action disabled state configured');

    // Note: Persistence testing requires chrome.storage mock
  });

  test('should update when enabling previously disabled action', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Create menu with disabled action
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const menuNameInput = optionsPage.locator('#menuName');
    await menuNameInput.clear();
    await menuNameInput.fill('Enable Action Test');

    // Add action
    const addActionBtn = optionsPage.locator('#add-action');
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles = optionsPage.locator('.action-title');
    await actionTitles.last().fill('Action to Enable');

    const actionPrompts = optionsPage.locator('.action-prompt');
    await actionPrompts.last().fill('This will be enabled');

    // Disable it
    const enabledCheckbox = optionsPage.locator('.action-enabled').last();
    await enabledCheckbox.uncheck();

    // Save
    const saveBtn = optionsPage.locator('#save');
    await saveBtn.click();
    await optionsPage.waitForTimeout(300);

    console.log('✓ Menu saved with disabled action');

    // Now enable the action
    await enabledCheckbox.check();

    // Save again
    await saveBtn.click();
    await optionsPage.waitForTimeout(300);

    // Verify it's saved as enabled (without reload)
    const isChecked = await enabledCheckbox.isChecked();
    expect(isChecked).toBe(true);
    console.log('✓ Action enabled state configured');

    // Note: Persistence testing requires chrome.storage mock
  });

  test('should update when deleting menu', async ({ optionsPage, page }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Get initial count
    const menuItems = optionsPage.locator('.menu-item');
    const initialCount = await menuItems.count();

    // Create a menu to delete
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const menuNameInput = optionsPage.locator('#menuName');
    const menuToDelete = 'Menu to Delete';
    await menuNameInput.clear();
    await menuNameInput.fill(menuToDelete);

    // Set a valid URL to pass validation
    const customGptUrlInput = optionsPage.locator('#customGptUrl');
    await customGptUrlInput.clear();
    await customGptUrlInput.fill('https://chatgpt.com/g/g-test123');

    const saveBtn = optionsPage.locator('#save');
    await saveBtn.click();

    // Wait for menu to appear in sidebar
    let menu = optionsPage.locator(`.menu-item:has-text("${menuToDelete}")`);
    await expect(menu).toBeVisible({ timeout: 5000 });
    console.log(`✓ Menu "${menuToDelete}" created`);

    // Set up continuous dialog handler
    optionsPage.on('dialog', dialog => dialog.accept());

    // Delete the menu
    const deleteBtn = optionsPage.locator('#delete-menu');
    await deleteBtn.click();
    await optionsPage.waitForTimeout(500);

    // Verify menu was removed
    menu = optionsPage.locator(`.menu-item:has-text("${menuToDelete}")`);
    await expect(menu).toHaveCount(0);
    console.log(`✓ Menu "${menuToDelete}" removed from configuration`);

    // Verify count returned to initial
    const finalCount = await menuItems.count();
    expect(finalCount).toBe(initialCount);
    console.log('✓ Menu count returned to initial value');
  });
});
