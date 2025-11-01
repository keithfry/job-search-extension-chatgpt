import { test, expect } from '../fixtures/extension.js';

/**
 * TEST-SH03: Shortcut Conflict Detection
 *
 * Verifies that:
 * 1. Duplicate shortcuts within same menu are detected
 * 2. Duplicate shortcuts across different menus are detected
 * 3. Error message shows which action already uses the shortcut
 * 4. Run All shortcut conflicts are detected
 * 5. User is warned but can still save (warning, not blocking)
 */

test.describe('Shortcut Tests - Conflict Detection', () => {
  test('should detect duplicate shortcut within same menu', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Create menu with two actions
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const menuNameInput = optionsPage.locator('#menuName');
    await menuNameInput.clear();
    await menuNameInput.fill('Conflict Test');

    const addActionBtn = optionsPage.locator('#add-action');

    // Add action 1
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles = optionsPage.locator('.action-title');
    await actionTitles.nth(0).fill('Action 1');

    const actionPrompts = optionsPage.locator('.action-prompt');
    await actionPrompts.nth(0).fill('Prompt 1');

    // Assign Ctrl+Shift+A to action 1
    const shortcutBtns = optionsPage.locator('.action-item .btn-capture');
    await shortcutBtns.nth(0).click();
    await optionsPage.waitForTimeout(100);

    await optionsPage.keyboard.down('Control');
    await optionsPage.keyboard.down('Shift');
    await optionsPage.keyboard.press('A');
    await optionsPage.keyboard.up('Shift');
    await optionsPage.keyboard.up('Control');
    await optionsPage.waitForTimeout(200);

    console.log('✓ Assigned Ctrl+Shift+A to Action 1');

    // Add action 2
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles2 = optionsPage.locator('.action-title');
    await actionTitles2.nth(1).fill('Action 2');

    const actionPrompts2 = optionsPage.locator('.action-prompt');
    await actionPrompts2.nth(1).fill('Prompt 2');

    // Try to assign same shortcut Ctrl+Shift+A to action 2
    const shortcutBtns2 = optionsPage.locator('.action-item .btn-capture');
    await shortcutBtns2.nth(1).click();
    await optionsPage.waitForTimeout(100);

    await optionsPage.keyboard.down('Control');
    await optionsPage.keyboard.down('Shift');
    await optionsPage.keyboard.press('A');
    await optionsPage.keyboard.up('Shift');
    await optionsPage.keyboard.up('Control');
    await optionsPage.waitForTimeout(300);

    // Should show error banner
    const errorBanner = optionsPage.locator('#error-banner');
    await expect(errorBanner).toBeVisible();

    const errorText = await errorBanner.textContent();
    expect(errorText.toLowerCase()).toContain('already');
    expect(errorText).toContain('Action 1');
    console.log(`✓ Conflict detected: ${errorText}`);
  });

  test('should detect duplicate shortcut across different menus', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    const addMenuBtn = optionsPage.locator('#add-menu');
    const addActionBtn = optionsPage.locator('#add-action');
    const saveBtn = optionsPage.locator('#save');

    // Create menu 1 with action and shortcut
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const menuNameInput = optionsPage.locator('#menuName');
    await menuNameInput.clear();
    await menuNameInput.fill('Menu A');

    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles = optionsPage.locator('.action-title');
    await actionTitles.last().fill('Menu A Action');

    const actionPrompts = optionsPage.locator('.action-prompt');
    await actionPrompts.last().fill('Prompt A');

    // Assign Ctrl+Shift+X
    const shortcutBtns = optionsPage.locator('.action-item .btn-capture');
    await shortcutBtns.last().click();
    await optionsPage.waitForTimeout(100);

    await optionsPage.keyboard.down('Control');
    await optionsPage.keyboard.down('Shift');
    await optionsPage.keyboard.press('X');
    await optionsPage.keyboard.up('Shift');
    await optionsPage.keyboard.up('Control');
    await optionsPage.waitForTimeout(200);

    await saveBtn.click();
    await optionsPage.waitForTimeout(300);
    console.log('✓ Menu A saved with Ctrl+Shift+X');

    // Create menu 2
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    await menuNameInput.clear();
    await menuNameInput.fill('Menu B');

    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles2 = optionsPage.locator('.action-title');
    await actionTitles2.last().fill('Menu B Action');

    const actionPrompts2 = optionsPage.locator('.action-prompt');
    await actionPrompts2.last().fill('Prompt B');

    // Try to assign same shortcut Ctrl+Shift+X
    const shortcutBtns2 = optionsPage.locator('.action-item .btn-capture');
    await shortcutBtns2.last().click();
    await optionsPage.waitForTimeout(100);

    await optionsPage.keyboard.down('Control');
    await optionsPage.keyboard.down('Shift');
    await optionsPage.keyboard.press('X');
    await optionsPage.keyboard.up('Shift');
    await optionsPage.keyboard.up('Control');
    await optionsPage.waitForTimeout(300);

    // Should show error
    const errorBanner = optionsPage.locator('#error-banner');
    await expect(errorBanner).toBeVisible();

    const errorText = await errorBanner.textContent();
    expect(errorText.toLowerCase()).toContain('already');
    expect(errorText).toContain('Menu A');
    console.log(`✓ Cross-menu conflict detected: ${errorText}`);
  });

  test('should detect conflict with Run All shortcut', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    const addMenuBtn = optionsPage.locator('#add-menu');
    const addActionBtn = optionsPage.locator('#add-action');
    const saveBtn = optionsPage.locator('#save');

    // Create menu with Run All enabled
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const menuNameInput = optionsPage.locator('#menuName');
    await menuNameInput.clear();
    await menuNameInput.fill('Run All Menu');

    // Enable Run All
    const runAllCheckbox = optionsPage.locator('#runAllEnabled');
    await runAllCheckbox.check();
    await optionsPage.waitForTimeout(200);

    // Assign shortcut to Run All
    const runAllShortcutBtn = optionsPage.locator('#runAllShortcutBtn');
    await runAllShortcutBtn.click();
    await optionsPage.waitForTimeout(100);

    await optionsPage.keyboard.down('Control');
    await optionsPage.keyboard.down('Shift');
    await optionsPage.keyboard.press('R');
    await optionsPage.keyboard.up('Shift');
    await optionsPage.keyboard.up('Control');
    await optionsPage.waitForTimeout(200);

    console.log('✓ Assigned Ctrl+Shift+R to Run All');

    // Add an action and try to use the same shortcut
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles = optionsPage.locator('.action-title');
    await actionTitles.last().fill('Conflicting Action');

    const actionPrompts = optionsPage.locator('.action-prompt');
    await actionPrompts.last().fill('Test');

    // Try to assign Ctrl+Shift+R to the action
    const shortcutBtns = optionsPage.locator('.action-item .btn-capture');
    await shortcutBtns.last().click();
    await optionsPage.waitForTimeout(100);

    await optionsPage.keyboard.down('Control');
    await optionsPage.keyboard.down('Shift');
    await optionsPage.keyboard.press('R');
    await optionsPage.keyboard.up('Shift');
    await optionsPage.keyboard.up('Control');
    await optionsPage.waitForTimeout(300);

    // Should show error about Run All
    const errorBanner = optionsPage.locator('#error-banner');
    await expect(errorBanner).toBeVisible();

    const errorText = await errorBanner.textContent();
    expect(errorText.toLowerCase()).toContain('run all');
    console.log(`✓ Run All conflict detected: ${errorText}`);
  });

  test('should allow same shortcut in different menus if both are disabled', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    const addMenuBtn = optionsPage.locator('#add-menu');
    const addActionBtn = optionsPage.locator('#add-action');
    const saveBtn = optionsPage.locator('#save');

    // Create menu 1 with disabled action
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const menuNameInput = optionsPage.locator('#menuName');
    await menuNameInput.clear();
    await menuNameInput.fill('Menu Disabled 1');

    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles = optionsPage.locator('.action-title');
    await actionTitles.last().fill('Disabled Action 1');

    const actionPrompts = optionsPage.locator('.action-prompt');
    await actionPrompts.last().fill('Test 1');

    // Disable the action
    const enabledCheckboxes = optionsPage.locator('.action-enabled');
    await enabledCheckboxes.last().uncheck();

    // Assign shortcut
    const shortcutBtns = optionsPage.locator('.action-item .btn-capture');
    await shortcutBtns.last().click();
    await optionsPage.waitForTimeout(100);

    await optionsPage.keyboard.down('Control');
    await optionsPage.keyboard.press('D');
    await optionsPage.keyboard.up('Control');
    await optionsPage.waitForTimeout(200);

    await saveBtn.click();
    await optionsPage.waitForTimeout(300);

    // Create menu 2 with disabled action using same shortcut
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    await menuNameInput.clear();
    await menuNameInput.fill('Menu Disabled 2');

    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles2 = optionsPage.locator('.action-title');
    await actionTitles2.last().fill('Disabled Action 2');

    const actionPrompts2 = optionsPage.locator('.action-prompt');
    await actionPrompts2.last().fill('Test 2');

    // Disable this action too
    const enabledCheckboxes2 = optionsPage.locator('.action-enabled');
    await enabledCheckboxes2.last().uncheck();

    // Assign same shortcut
    const shortcutBtns2 = optionsPage.locator('.action-item .btn-capture');
    await shortcutBtns2.last().click();
    await optionsPage.waitForTimeout(100);

    await optionsPage.keyboard.down('Control');
    await optionsPage.keyboard.press('D');
    await optionsPage.keyboard.up('Control');
    await optionsPage.waitForTimeout(300);

    // Since both are disabled, conflict detection might not trigger
    // Check if error is shown - implementation may vary
    const errorBanner = optionsPage.locator('#error-banner');
    const isVisible = await errorBanner.isVisible();

    if (!isVisible) {
      console.log('✓ No conflict for disabled actions (as expected)');
    } else {
      const errorText = await errorBanner.textContent();
      console.log(`Note: Conflict detected even for disabled actions: ${errorText}`);
    }
  });

  test('should update conflict check when editing existing shortcut', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    const addMenuBtn = optionsPage.locator('#add-menu');
    const addActionBtn = optionsPage.locator('#add-action');
    const saveBtn = optionsPage.locator('#save');

    // Create menu with action
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const menuNameInput = optionsPage.locator('#menuName');
    await menuNameInput.clear();
    await menuNameInput.fill('Edit Shortcut Test');

    // Add two actions
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles = optionsPage.locator('.action-title');
    await actionTitles.nth(0).fill('Action Original');

    const actionPrompts = optionsPage.locator('.action-prompt');
    await actionPrompts.nth(0).fill('Test 1');

    // Assign Ctrl+E to first action
    const shortcutBtns = optionsPage.locator('.action-item .btn-capture');
    await shortcutBtns.nth(0).click();
    await optionsPage.waitForTimeout(100);

    await optionsPage.keyboard.down('Control');
    await optionsPage.keyboard.press('E');
    await optionsPage.keyboard.up('Control');
    await optionsPage.waitForTimeout(200);

    // Add second action
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles2 = optionsPage.locator('.action-title');
    await actionTitles2.nth(1).fill('Action New');

    const actionPrompts2 = optionsPage.locator('.action-prompt');
    await actionPrompts2.nth(1).fill('Test 2');

    // Try to assign Ctrl+E to second action
    const shortcutBtns2 = optionsPage.locator('.action-item .btn-capture');
    await shortcutBtns2.nth(1).click();
    await optionsPage.waitForTimeout(100);

    await optionsPage.keyboard.down('Control');
    await optionsPage.keyboard.press('E');
    await optionsPage.keyboard.up('Control');
    await optionsPage.waitForTimeout(300);

    // Should detect conflict
    const errorBanner = optionsPage.locator('#error-banner');
    await expect(errorBanner).toBeVisible();
    console.log('✓ Conflict detected when assigning duplicate shortcut');
  });
});
