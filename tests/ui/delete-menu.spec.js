import { test, expect } from '../fixtures/extension.js';

/**
 * TEST-UI04: Delete Menu with Confirmation
 *
 * Verifies that:
 * 1. Delete button is visible when menu is selected
 * 2. Clicking delete shows confirmation dialog
 * 3. Confirming deletion removes the menu
 * 4. Canceling deletion keeps the menu
 * 5. Menu counter updates after deletion
 * 6. Another menu is auto-selected after deletion
 */

test.describe('UI Tests - Delete Menu', () => {
  test('should show delete button for selected menu', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Select first menu
    const firstMenuItem = optionsPage.locator('.menu-item').first();
    await firstMenuItem.click();
    await optionsPage.waitForTimeout(200);

    // Verify delete button is visible
    const deleteBtn = optionsPage.locator('#delete-menu');
    await expect(deleteBtn).toBeVisible();
    console.log('✓ Delete button is visible');
  });

  test('should delete menu after confirmation', async ({ optionsPage, page }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Create a new menu to delete
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    // Give it a unique name
    const menuNameInput = optionsPage.locator('#menuName');
    const uniqueName = `Delete Me ${Date.now()}`;
    await menuNameInput.clear();
    await menuNameInput.fill(uniqueName);

    // Save it
    const saveBtn = optionsPage.locator('#save');
    await saveBtn.click();
    await optionsPage.waitForTimeout(300);

    // Count menus before deletion
    const menuItems = optionsPage.locator('.menu-item');
    const beforeCount = await menuItems.count();
    console.log(`Menu count before deletion: ${beforeCount}`);

    // Set up dialog handler to accept the confirmation
    page.on('dialog', async (dialog) => {
      console.log(`Confirmation dialog: "${dialog.message()}"`);
      expect(dialog.message()).toContain('Delete');
      await dialog.accept();
    });

    // Click delete
    const deleteBtn = optionsPage.locator('#delete-menu');
    await deleteBtn.click();
    await optionsPage.waitForTimeout(500);

    // Verify menu was deleted
    const afterCount = await menuItems.count();
    expect(afterCount).toBe(beforeCount - 1);
    console.log(`✓ Menu deleted. Count after: ${afterCount}`);

    // Verify the menu no longer appears in sidebar
    const deletedMenu = optionsPage.locator(`.menu-item:has-text("${uniqueName}")`);
    await expect(deletedMenu).toHaveCount(0);
    console.log(`✓ Menu "${uniqueName}" removed from sidebar`);
  });

  test('should cancel deletion when dialog is dismissed', async ({ optionsPage, page }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Create a menu
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const menuNameInput = optionsPage.locator('#menuName');
    const uniqueName = `Keep Me ${Date.now()}`;
    await menuNameInput.clear();
    await menuNameInput.fill(uniqueName);

    const saveBtn = optionsPage.locator('#save');
    await saveBtn.click();
    await optionsPage.waitForTimeout(300);

    // Count menus
    const menuItems = optionsPage.locator('.menu-item');
    const beforeCount = await menuItems.count();

    // Set up dialog handler to CANCEL
    page.on('dialog', async (dialog) => {
      console.log(`Canceling deletion dialog`);
      await dialog.dismiss();
    });

    // Click delete
    const deleteBtn = optionsPage.locator('#delete-menu');
    await deleteBtn.click();
    await optionsPage.waitForTimeout(300);

    // Verify menu was NOT deleted
    const afterCount = await menuItems.count();
    expect(afterCount).toBe(beforeCount);
    console.log(`✓ Menu count unchanged: ${afterCount}`);

    // Verify menu still exists
    const keptMenu = optionsPage.locator(`.menu-item:has-text("${uniqueName}")`);
    await expect(keptMenu).toHaveCount(1);
    console.log(`✓ Menu "${uniqueName}" was kept`);
  });

  test('should auto-select another menu after deletion', async ({ optionsPage, page }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Ensure we have at least 2 menus
    const menuItems = optionsPage.locator('.menu-item');
    let currentCount = await menuItems.count();

    if (currentCount < 2) {
      const addMenuBtn = optionsPage.locator('#add-menu');
      await addMenuBtn.click();
      await optionsPage.waitForTimeout(200);
      const saveBtn = optionsPage.locator('#save');
      await saveBtn.click();
      await optionsPage.waitForTimeout(300);
      currentCount = await menuItems.count();
    }

    console.log(`Starting with ${currentCount} menus`);

    // Select the first menu and delete it
    const firstMenuItem = optionsPage.locator('.menu-item').first();
    await firstMenuItem.click();
    await optionsPage.waitForTimeout(200);

    // Accept deletion dialog
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    const deleteBtn = optionsPage.locator('#delete-menu');
    await deleteBtn.click();
    await optionsPage.waitForTimeout(500);

    // Verify another menu is now selected
    const selectedMenus = optionsPage.locator('.menu-item.selected');
    const selectedCount = await selectedMenus.count();

    if (currentCount > 1) {
      // If there were multiple menus, one should be selected
      expect(selectedCount).toBe(1);
      console.log('✓ Another menu auto-selected after deletion');
    } else {
      // If it was the last menu, no menu should be selected
      expect(selectedCount).toBe(0);
      console.log('✓ No menu selected (last menu deleted)');
    }
  });

  test('should update menu counter after deletion', async ({ optionsPage, page }) => {
    await optionsPage.waitForLoadState('networkidle');

    const menuCounter = optionsPage.locator('#menu-count');
    const beforeCounterText = await menuCounter.textContent();
    console.log(`Counter before: ${beforeCounterText}`);

    // Create a menu to delete
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const saveBtn = optionsPage.locator('#save');
    await saveBtn.click();
    await optionsPage.waitForTimeout(300);

    const afterAddText = await menuCounter.textContent();
    console.log(`Counter after add: ${afterAddText}`);

    // Accept deletion
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Delete the menu
    const deleteBtn = optionsPage.locator('#delete-menu');
    await deleteBtn.click();
    await optionsPage.waitForTimeout(500);

    // Counter should be back to original
    const afterDeleteText = await menuCounter.textContent();
    expect(afterDeleteText).toBe(beforeCounterText);
    console.log(`✓ Counter after delete: ${afterDeleteText}`);
  });

  test('should show action count in confirmation dialog', async ({ optionsPage, page }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Create a menu with actions
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    // Add an action
    const addActionBtn = optionsPage.locator('#add-action');
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    // Fill in action details
    const actionTitleInputs = optionsPage.locator('.action-title');
    const lastTitleInput = actionTitleInputs.last();
    await lastTitleInput.fill('Test Action');

    const actionPromptInputs = optionsPage.locator('.action-prompt');
    const lastPromptInput = actionPromptInputs.last();
    await lastPromptInput.fill('Test prompt');

    // Save the menu
    const saveBtn = optionsPage.locator('#save');
    await saveBtn.click();
    await optionsPage.waitForTimeout(300);

    // Capture the dialog message
    let dialogMessage = '';
    page.on('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      console.log(`Dialog message: "${dialogMessage}"`);
      await dialog.accept();
    });

    // Delete the menu
    const deleteBtn = optionsPage.locator('#delete-menu');
    await deleteBtn.click();
    await optionsPage.waitForTimeout(500);

    // Verify dialog mentioned the action count
    expect(dialogMessage).toContain('action');
    console.log(`✓ Confirmation dialog showed action count`);
  });
});
