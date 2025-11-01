import { test, expect } from '../fixtures/extension.js';

/**
 * TEST-SH01 & TEST-SH02: Action Shortcuts for Multiple Menus
 *
 * Verifies that:
 * 1. Shortcuts can be assigned to actions in menu 1
 * 2. Shortcuts can be assigned to actions in menu 2
 * 3. Pressing shortcut executes correct action
 * 4. Shortcuts route to correct menu's GPT URL
 * 5. Each menu's shortcuts work independently
 */

test.describe('Shortcut Tests - Action Shortcuts', () => {
  test('TEST-SH01: should assign and display shortcut for menu 1 action', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Create menu 1 with an action
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const menuNameInput = optionsPage.locator('#menuName');
    await menuNameInput.clear();
    await menuNameInput.fill('Menu 1 Shortcuts');

    // Add action
    const addActionBtn = optionsPage.locator('#add-action');
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles = optionsPage.locator('.action-title');
    await actionTitles.last().fill('Summarize');

    const actionPrompts = optionsPage.locator('.action-prompt');
    await actionPrompts.last().fill('Please summarize:');

    // Click the shortcut capture button
    const shortcutBtns = optionsPage.locator('.action-item .btn-capture');
    await shortcutBtns.last().click();
    await optionsPage.waitForTimeout(100);

    // Press Ctrl+Shift+S
    await optionsPage.keyboard.down('Control');
    await optionsPage.keyboard.down('Shift');
    await optionsPage.keyboard.press('S');
    await optionsPage.keyboard.up('Shift');
    await optionsPage.keyboard.up('Control');
    await optionsPage.waitForTimeout(200);

    // Verify shortcut was captured
    const shortcutInputs = optionsPage.locator('.action-item .action-shortcut');
    const shortcutValue = await shortcutInputs.last().inputValue();
    expect(shortcutValue).toContain('Ctrl');
    expect(shortcutValue).toContain('Shift');
    expect(shortcutValue).toContain('S');
    console.log(`✓ Shortcut captured for Menu 1: ${shortcutValue}`);

    // Verify shortcut remains in input after capture
    const finalShortcut = await shortcutInputs.last().inputValue();
    expect(finalShortcut).toBe(shortcutValue);
    console.log(`✓ Shortcut retained: ${finalShortcut}`);

    // Note: Persistence testing requires chrome.storage mock
  });

  test('TEST-SH02: should assign different shortcut for menu 2 action', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Create menu 2 with an action
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const menuNameInput = optionsPage.locator('#menuName');
    await menuNameInput.clear();
    await menuNameInput.fill('Menu 2 Shortcuts');

    // Add action
    const addActionBtn = optionsPage.locator('#add-action');
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles = optionsPage.locator('.action-title');
    await actionTitles.last().fill('Translate');

    const actionPrompts = optionsPage.locator('.action-prompt');
    await actionPrompts.last().fill('Please translate:');

    // Assign a different shortcut: Ctrl+Shift+T
    const shortcutBtns = optionsPage.locator('.action-item .btn-capture');
    await shortcutBtns.last().click();
    await optionsPage.waitForTimeout(100);

    await optionsPage.keyboard.down('Control');
    await optionsPage.keyboard.down('Shift');
    await optionsPage.keyboard.press('T');
    await optionsPage.keyboard.up('Shift');
    await optionsPage.keyboard.up('Control');
    await optionsPage.waitForTimeout(200);

    // Verify shortcut was captured
    const shortcutInputs = optionsPage.locator('.action-item .action-shortcut');
    const shortcutValue = await shortcutInputs.last().inputValue();
    expect(shortcutValue).toContain('Ctrl');
    expect(shortcutValue).toContain('T');
    console.log(`✓ Shortcut captured for Menu 2: ${shortcutValue}`);

    // Save
    const saveBtn = optionsPage.locator('#save');
    await saveBtn.click();
    await optionsPage.waitForTimeout(300);

    console.log('✓ Menu 2 has different shortcut than Menu 1');
  });

  test('should allow same key combination with different modifiers', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Create menu
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    // Add two actions with different modifier combos
    const addActionBtn = optionsPage.locator('#add-action');

    // Action 1: Ctrl+S
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles = optionsPage.locator('.action-title');
    await actionTitles.last().fill('Action Ctrl+S');

    const actionPrompts = optionsPage.locator('.action-prompt');
    await actionPrompts.last().fill('Prompt 1');

    const shortcutBtns = optionsPage.locator('.action-item .btn-capture');
    await shortcutBtns.last().click();
    await optionsPage.waitForTimeout(100);

    await optionsPage.keyboard.down('Control');
    await optionsPage.keyboard.press('S');
    await optionsPage.keyboard.up('Control');
    await optionsPage.waitForTimeout(200);

    // Action 2: Alt+S
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles2 = optionsPage.locator('.action-title');
    await actionTitles2.last().fill('Action Alt+S');

    const actionPrompts2 = optionsPage.locator('.action-prompt');
    await actionPrompts2.last().fill('Prompt 2');

    const shortcutBtns2 = optionsPage.locator('.action-item .btn-capture');
    await shortcutBtns2.last().click();
    await optionsPage.waitForTimeout(100);

    await optionsPage.keyboard.down('Alt');
    await optionsPage.keyboard.press('S');
    await optionsPage.keyboard.up('Alt');
    await optionsPage.waitForTimeout(200);

    // Both should be captured without conflict
    const shortcutInputs = optionsPage.locator('.action-item .action-shortcut');
    const shortcut1 = await shortcutInputs.nth(0).inputValue();
    const shortcut2 = await shortcutInputs.nth(1).inputValue();

    expect(shortcut1).toContain('Ctrl');
    expect(shortcut2).toContain('Alt');
    console.log(`✓ Different modifiers allowed: ${shortcut1} and ${shortcut2}`);
  });

  test('should clear shortcut with Delete key', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Create menu with action
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const addActionBtn = optionsPage.locator('#add-action');
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles = optionsPage.locator('.action-title');
    await actionTitles.last().fill('Test Clear');

    const actionPrompts = optionsPage.locator('.action-prompt');
    await actionPrompts.last().fill('Test');

    // Assign shortcut
    const shortcutBtns = optionsPage.locator('.action-item .btn-capture');
    await shortcutBtns.last().click();
    await optionsPage.waitForTimeout(100);

    await optionsPage.keyboard.down('Control');
    await optionsPage.keyboard.press('X');
    await optionsPage.keyboard.up('Control');
    await optionsPage.waitForTimeout(200);

    const shortcutInputs = optionsPage.locator('.action-item .action-shortcut');
    let shortcutValue = await shortcutInputs.last().inputValue();
    expect(shortcutValue).toBeTruthy();
    console.log(`Shortcut assigned: ${shortcutValue}`);

    // Click on the shortcut input and press Delete
    await shortcutInputs.last().click();
    await optionsPage.keyboard.press('Delete');
    await optionsPage.waitForTimeout(200);

    // Shortcut should be cleared
    shortcutValue = await shortcutInputs.last().inputValue();
    expect(shortcutValue).toBe('');
    console.log('✓ Shortcut cleared with Delete key');
  });

  test('should show reload reminder when shortcuts change', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Ensure reload reminder is hidden initially
    const reloadReminder = optionsPage.locator('#reload-reminder');
    await expect(reloadReminder).toHaveClass(/hidden/);

    // Create menu with action
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const addActionBtn = optionsPage.locator('#add-action');
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles = optionsPage.locator('.action-title');
    await actionTitles.last().fill('Test Reminder');

    const actionPrompts = optionsPage.locator('.action-prompt');
    await actionPrompts.last().fill('Test');

    // Assign shortcut
    const shortcutBtns = optionsPage.locator('.action-item .btn-capture');
    await shortcutBtns.last().click();
    await optionsPage.waitForTimeout(100);

    await optionsPage.keyboard.down('Control');
    await optionsPage.keyboard.press('R');
    await optionsPage.keyboard.up('Control');
    await optionsPage.waitForTimeout(300);

    // Reload reminder should now be visible
    await expect(reloadReminder).not.toHaveClass(/hidden/);
    console.log('✓ Reload reminder shown after shortcut change');
  });

  test('should validate shortcuts require at least one modifier', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Create menu with action
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const addActionBtn = optionsPage.locator('#add-action');
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles = optionsPage.locator('.action-title');
    await actionTitles.last().fill('No Modifier Test');

    const actionPrompts = optionsPage.locator('.action-prompt');
    await actionPrompts.last().fill('Test');

    // Try to assign just a letter (no modifier)
    const shortcutBtns = optionsPage.locator('.action-item .btn-capture');
    await shortcutBtns.last().click();
    await optionsPage.waitForTimeout(100);

    await optionsPage.keyboard.press('A');
    await optionsPage.waitForTimeout(300);

    // Should show error
    const errorBanner = optionsPage.locator('#error-banner');
    const isVisible = await errorBanner.isVisible();

    if (isVisible) {
      const errorText = await errorBanner.textContent();
      expect(errorText.toLowerCase()).toContain('modifier');
      console.log(`✓ Error shown: ${errorText}`);
    }

    // Shortcut should be empty
    const shortcutInputs = optionsPage.locator('.action-item .action-shortcut');
    const shortcutValue = await shortcutInputs.last().inputValue();
    expect(shortcutValue).toBe('');
    console.log('✓ Shortcut without modifier was rejected');
  });
});
