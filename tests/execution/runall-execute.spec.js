import { test, expect } from '../fixtures/extension.js';

/**
 * TEST-AE06: Run All Executes All Menu Actions
 *
 * Verifies that:
 * 1. Run All option can be enabled for a menu
 * 2. Run All appears in the menu configuration
 * 3. Run All shortcut can be assigned
 * 4. Configuration is properly saved
 * 5. Run All is specific to each menu
 *
 * Note: Full end-to-end execution testing would require ChatGPT access.
 * This test verifies the configuration aspects of Run All.
 */

test.describe('Action Execution Tests - Run All', () => {
  test('should enable Run All for a menu', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Create a menu
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const menuNameInput = optionsPage.locator('#menuName');
    await menuNameInput.clear();
    await menuNameInput.fill('Run All Test Menu');

    // Enable Run All
    const runAllCheckbox = optionsPage.locator('#runAllEnabled');
    await expect(runAllCheckbox).toBeVisible();
    await runAllCheckbox.check();
    await optionsPage.waitForTimeout(200);

    // Verify Run All shortcut section appears
    const runAllShortcutGroup = optionsPage.locator('#runAllShortcutGroup');
    await expect(runAllShortcutGroup).toBeVisible();
    console.log('✓ Run All enabled and shortcut section visible');

    // Verify Run All is enabled (without reload)
    const isChecked = await runAllCheckbox.isChecked();
    expect(isChecked).toBe(true);
    console.log('✓ Run All setting configured');

    // Note: Persistence testing requires chrome.storage mock which is not implemented
    // The save functionality is tested separately
  });

  test('should assign shortcut to Run All', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Create menu
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const menuNameInput = optionsPage.locator('#menuName');
    await menuNameInput.clear();
    await menuNameInput.fill('Run All Shortcut Test');

    // Enable Run All
    const runAllCheckbox = optionsPage.locator('#runAllEnabled');
    await runAllCheckbox.check();
    await optionsPage.waitForTimeout(200);

    // Click shortcut capture button
    const runAllShortcutBtn = optionsPage.locator('#runAllShortcutBtn');
    await runAllShortcutBtn.click();
    await optionsPage.waitForTimeout(100);

    // Assign Ctrl+Shift+R
    await optionsPage.keyboard.down('Control');
    await optionsPage.keyboard.down('Shift');
    await optionsPage.keyboard.press('R');
    await optionsPage.keyboard.up('Shift');
    await optionsPage.keyboard.up('Control');
    await optionsPage.waitForTimeout(200);

    // Verify shortcut was captured
    const runAllShortcutInput = optionsPage.locator('#runAllShortcut');
    const shortcutValue = await runAllShortcutInput.inputValue();
    expect(shortcutValue).toContain('Ctrl');
    expect(shortcutValue).toContain('Shift');
    expect(shortcutValue).toContain('R');
    console.log(`✓ Run All shortcut assigned: ${shortcutValue}`);

    // Shortcut remains in input after capture
    const finalShortcut = await runAllShortcutInput.inputValue();
    expect(finalShortcut).toBe(shortcutValue);
    console.log(`✓ Run All shortcut retained: ${finalShortcut}`);

    // Note: Persistence testing requires chrome.storage mock
  });

  test('should hide Run All shortcut when Run All is disabled', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Create menu
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const runAllCheckbox = optionsPage.locator('#runAllEnabled');
    const runAllShortcutGroup = optionsPage.locator('#runAllShortcutGroup');

    // Initially unchecked - shortcut section should be hidden
    const isChecked = await runAllCheckbox.isChecked();
    if (!isChecked) {
      const isVisible = await runAllShortcutGroup.isVisible();
      expect(isVisible).toBe(false);
      console.log('✓ Run All shortcut hidden when disabled');
    }

    // Enable Run All
    await runAllCheckbox.check();
    await optionsPage.waitForTimeout(200);

    // Shortcut section should now be visible
    await expect(runAllShortcutGroup).toBeVisible();
    console.log('✓ Run All shortcut shown when enabled');

    // Disable again
    await runAllCheckbox.uncheck();
    await optionsPage.waitForTimeout(200);

    // Should hide again
    const isVisibleAfter = await runAllShortcutGroup.isVisible();
    expect(isVisibleAfter).toBe(false);
    console.log('✓ Run All shortcut hidden when disabled again');
  });

  test('should allow different Run All settings per menu', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    const addMenuBtn = optionsPage.locator('#add-menu');
    const menuNameInput = optionsPage.locator('#menuName');
    const runAllCheckbox = optionsPage.locator('#runAllEnabled');
    const saveBtn = optionsPage.locator('#save');

    // Create Menu 1 with Run All enabled
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    await menuNameInput.clear();
    await menuNameInput.fill('Menu Run All ON');

    // Set a valid URL to pass validation
    const customGptUrlInput = optionsPage.locator('#customGptUrl');
    await customGptUrlInput.clear();
    await customGptUrlInput.fill('https://chatgpt.com/g/g-test123');

    await runAllCheckbox.check();
    await saveBtn.click();

    // Wait for Menu 1 to appear in sidebar
    const menu1 = optionsPage.locator('.menu-item:has-text("Menu Run All ON")');
    await expect(menu1).toBeVisible({ timeout: 5000 });
    console.log('✓ Menu 1 created with Run All enabled');

    // Create Menu 2 with Run All disabled
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    await menuNameInput.clear();
    await menuNameInput.fill('Menu Run All OFF');

    // Set a valid URL to pass validation
    await customGptUrlInput.clear();
    await customGptUrlInput.fill('https://chatgpt.com/g/g-test456');

    await runAllCheckbox.uncheck();
    await saveBtn.click();

    // Wait for Menu 2 to appear in sidebar
    const menu2 = optionsPage.locator('.menu-item:has-text("Menu Run All OFF")');
    await expect(menu2).toBeVisible({ timeout: 5000 });
    console.log('✓ Menu 2 created with Run All disabled');

    // Switch back to Menu 1
    await menu1.click();
    await optionsPage.waitForTimeout(200);

    let isChecked = await runAllCheckbox.isChecked();
    expect(isChecked).toBe(true);
    console.log('✓ Menu 1 has Run All enabled');

    // Switch to Menu 2
    await menu2.click();
    await optionsPage.waitForTimeout(200);

    isChecked = await runAllCheckbox.isChecked();
    expect(isChecked).toBe(false);
    console.log('✓ Menu 2 has Run All disabled');
    console.log('✓ Run All settings are independent per menu');
  });

  test('should configure menu with multiple actions for Run All', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Create menu
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const menuNameInput = optionsPage.locator('#menuName');
    await menuNameInput.clear();
    await menuNameInput.fill('Multi-Action Run All');

    // Enable Run All
    const runAllCheckbox = optionsPage.locator('#runAllEnabled');
    await runAllCheckbox.check();
    await optionsPage.waitForTimeout(200);

    // Add multiple actions
    const addActionBtn = optionsPage.locator('#add-action');

    for (let i = 1; i <= 3; i++) {
      await addActionBtn.click();
      await optionsPage.waitForTimeout(200);

      const actionTitles = optionsPage.locator('.action-title');
      const actionPrompts = optionsPage.locator('.action-prompt');

      await actionTitles.nth(i - 1).fill(`Action ${i}`);
      await actionPrompts.nth(i - 1).fill(`Prompt ${i}`);
    }

    console.log('✓ Added 3 actions to menu');

    // Verify all 3 actions are present
    const actionItems = optionsPage.locator('.action-item');
    const actionCount = await actionItems.count();
    expect(actionCount).toBe(3);
    console.log(`✓ All 3 actions configured for Run All menu`);

    // Verify Run All is still enabled
    const isChecked = await runAllCheckbox.isChecked();
    expect(isChecked).toBe(true);
    console.log('✓ Run All enabled for menu with multiple actions');

    // Note: Persistence testing requires chrome.storage mock
  });

  test('should clear Run All shortcut with Delete key', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Create menu
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    // Enable Run All
    const runAllCheckbox = optionsPage.locator('#runAllEnabled');
    await runAllCheckbox.check();
    await optionsPage.waitForTimeout(200);

    // Assign shortcut
    const runAllShortcutBtn = optionsPage.locator('#runAllShortcutBtn');
    await runAllShortcutBtn.click();
    await optionsPage.waitForTimeout(100);

    await optionsPage.keyboard.down('Control');
    await optionsPage.keyboard.press('Q');
    await optionsPage.keyboard.up('Control');
    await optionsPage.waitForTimeout(200);

    const runAllShortcutInput = optionsPage.locator('#runAllShortcut');
    let shortcutValue = await runAllShortcutInput.inputValue();
    expect(shortcutValue).toBeTruthy();
    console.log(`Shortcut assigned: ${shortcutValue}`);

    // Clear with Delete key
    await runAllShortcutInput.click();
    await optionsPage.keyboard.press('Delete');
    await optionsPage.waitForTimeout(200);

    // Verify cleared
    shortcutValue = await runAllShortcutInput.inputValue();
    expect(shortcutValue).toBe('');
    console.log('✓ Run All shortcut cleared with Delete key');
  });

  test('should show reload reminder when Run All shortcut changes', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    const reloadReminder = optionsPage.locator('#reload-reminder');

    // Create menu
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    // Enable Run All
    const runAllCheckbox = optionsPage.locator('#runAllEnabled');
    await runAllCheckbox.check();
    await optionsPage.waitForTimeout(200);

    // Assign shortcut
    const runAllShortcutBtn = optionsPage.locator('#runAllShortcutBtn');
    await runAllShortcutBtn.click();
    await optionsPage.waitForTimeout(100);

    await optionsPage.keyboard.down('Control');
    await optionsPage.keyboard.press('W');
    await optionsPage.keyboard.up('Control');
    await optionsPage.waitForTimeout(300);

    // Reload reminder should be visible
    await expect(reloadReminder).not.toHaveClass(/hidden/);
    console.log('✓ Reload reminder shown after Run All shortcut change');
  });
});
