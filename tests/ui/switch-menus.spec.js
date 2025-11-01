import { test, expect } from '../fixtures/extension.js';

/**
 * TEST-UI07: Switch Between Menus
 *
 * Verifies that:
 * 1. Clicking different menus in list updates detail panel
 * 2. Selected menu is highlighted in sidebar
 * 3. Detail panel shows correct menu configuration
 * 4. Detail panel shows correct actions for selected menu
 * 5. Switching preserves unsaved changes warning (if applicable)
 */

test.describe('UI Tests - Switch Between Menus', () => {
  test('should update detail panel when clicking different menus', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Ensure we have at least 2 menus with different names
    const menuItems = optionsPage.locator('.menu-item');
    let menuCount = await menuItems.count();

    // Create menus if needed
    if (menuCount < 2) {
      for (let i = menuCount; i < 2; i++) {
        const addMenuBtn = optionsPage.locator('#add-menu');
        await addMenuBtn.click();
        await optionsPage.waitForTimeout(200);

        const menuNameInput = optionsPage.locator('#menuName');
        await menuNameInput.clear();
        await menuNameInput.fill(`Menu ${i + 1}`);

        const saveBtn = optionsPage.locator('#save');
        await saveBtn.click();
        await optionsPage.waitForTimeout(300);
      }

      menuCount = await menuItems.count();
    }

    console.log(`Testing with ${menuCount} menus`);

    // Click first menu
    const firstMenu = menuItems.first();
    await firstMenu.click();
    await optionsPage.waitForTimeout(200);

    const menuNameInput = optionsPage.locator('#menuName');
    const firstName = await menuNameInput.inputValue();
    console.log(`First menu name: "${firstName}"`);

    // Click second menu
    const secondMenu = menuItems.nth(1);
    await secondMenu.click();
    await optionsPage.waitForTimeout(200);

    const secondName = await menuNameInput.inputValue();
    console.log(`Second menu name: "${secondName}"`);

    // Names should be different
    expect(firstName).not.toBe(secondName);
    console.log('✓ Detail panel updated when switching menus');
  });

  test('should highlight selected menu in sidebar', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    const menuItems = optionsPage.locator('.menu-item');
    const menuCount = await menuItems.count();

    if (menuCount < 2) {
      // Create a second menu
      const addMenuBtn = optionsPage.locator('#add-menu');
      await addMenuBtn.click();
      await optionsPage.waitForTimeout(200);
      const saveBtn = optionsPage.locator('#save');
      await saveBtn.click();
      await optionsPage.waitForTimeout(300);
    }

    // Click first menu
    const firstMenu = menuItems.first();
    await firstMenu.click();
    await optionsPage.waitForTimeout(200);

    // Verify first menu is selected
    await expect(firstMenu).toHaveClass(/selected/);
    const secondMenu = menuItems.nth(1);
    await expect(secondMenu).not.toHaveClass(/selected/);
    console.log('✓ First menu highlighted');

    // Click second menu
    await secondMenu.click();
    await optionsPage.waitForTimeout(200);

    // Verify second menu is selected, first is not
    await expect(firstMenu).not.toHaveClass(/selected/);
    await expect(secondMenu).toHaveClass(/selected/);
    console.log('✓ Second menu highlighted, first unhighlighted');
  });

  test('should show correct actions for each menu', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Create two menus with different actions
    const addMenuBtn = optionsPage.locator('#add-menu');

    // Create menu 1
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    const menuNameInput = optionsPage.locator('#menuName');
    await menuNameInput.clear();
    await menuNameInput.fill('Menu with Action A');

    // Add action A
    const addActionBtn = optionsPage.locator('#add-action');
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles = optionsPage.locator('.action-title');
    const lastTitle = actionTitles.last();
    await lastTitle.fill('Action A');

    const actionPrompts = optionsPage.locator('.action-prompt');
    const lastPrompt = actionPrompts.last();
    await lastPrompt.fill('Prompt A');

    // Save menu 1
    const saveBtn = optionsPage.locator('#save');
    await saveBtn.click();
    await optionsPage.waitForTimeout(300);

    // Create menu 2
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    await menuNameInput.clear();
    await menuNameInput.fill('Menu with Action B');

    // Add action B
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    const actionTitles2 = optionsPage.locator('.action-title');
    const lastTitle2 = actionTitles2.last();
    await lastTitle2.fill('Action B');

    const actionPrompts2 = optionsPage.locator('.action-prompt');
    const lastPrompt2 = actionPrompts2.last();
    await lastPrompt2.fill('Prompt B');

    // Save menu 2
    await saveBtn.click();
    await optionsPage.waitForTimeout(300);

    // Now switch back to menu 1
    const menuItems = optionsPage.locator('.menu-item');
    const menu1 = optionsPage.locator('.menu-item:has-text("Menu with Action A")');
    await menu1.click();
    await optionsPage.waitForTimeout(200);

    // Verify action A is shown
    const actionItems = optionsPage.locator('.action-item');
    const actionTitle = actionItems.first().locator('.action-title');
    const titleValue = await actionTitle.inputValue();
    expect(titleValue).toContain('Action A');
    console.log('✓ Menu 1 shows Action A');

    // Switch to menu 2
    const menu2 = optionsPage.locator('.menu-item:has-text("Menu with Action B")');
    await menu2.click();
    await optionsPage.waitForTimeout(200);

    // Verify action B is shown
    const actionTitle2 = actionItems.first().locator('.action-title');
    const titleValue2 = await actionTitle2.inputValue();
    expect(titleValue2).toContain('Action B');
    console.log('✓ Menu 2 shows Action B');
  });

  test('should show correct URLs for each menu', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    const addMenuBtn = optionsPage.locator('#add-menu');
    const menuNameInput = optionsPage.locator('#menuName');
    const urlInput = optionsPage.locator('#customGptUrl');
    const saveBtn = optionsPage.locator('#save');

    // Create menu 1 with URL 1
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    await menuNameInput.clear();
    await menuNameInput.fill('Menu URL 1');

    await urlInput.clear();
    await urlInput.fill('https://chatgpt.com/g/g-111111111');

    await saveBtn.click();
    await optionsPage.waitForTimeout(300);

    // Create menu 2 with URL 2
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    await menuNameInput.clear();
    await menuNameInput.fill('Menu URL 2');

    await urlInput.clear();
    await urlInput.fill('https://chatgpt.com/g/g-222222222');

    await saveBtn.click();
    await optionsPage.waitForTimeout(300);

    // Switch to menu 1
    const menu1 = optionsPage.locator('.menu-item:has-text("Menu URL 1")');
    await menu1.click();
    await optionsPage.waitForTimeout(200);

    const url1 = await urlInput.inputValue();
    expect(url1).toBe('https://chatgpt.com/g/g-111111111');
    console.log('✓ Menu 1 shows correct URL');

    // Switch to menu 2
    const menu2 = optionsPage.locator('.menu-item:has-text("Menu URL 2")');
    await menu2.click();
    await optionsPage.waitForTimeout(200);

    const url2 = await urlInput.inputValue();
    expect(url2).toBe('https://chatgpt.com/g/g-222222222');
    console.log('✓ Menu 2 shows correct URL');
  });

  test('should show correct auto-submit setting for each menu', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    const addMenuBtn = optionsPage.locator('#add-menu');
    const menuNameInput = optionsPage.locator('#menuName');
    const autoSubmitCheckbox = optionsPage.locator('#autoSubmit');
    const saveBtn = optionsPage.locator('#save');

    // Create menu with auto-submit enabled
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    await menuNameInput.clear();
    await menuNameInput.fill('Auto Submit ON');

    await autoSubmitCheckbox.check();
    await saveBtn.click();
    await optionsPage.waitForTimeout(300);

    // Create menu with auto-submit disabled
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(200);

    await menuNameInput.clear();
    await menuNameInput.fill('Auto Submit OFF');

    await autoSubmitCheckbox.uncheck();
    await saveBtn.click();
    await optionsPage.waitForTimeout(300);

    // Switch to first menu
    const menu1 = optionsPage.locator('.menu-item:has-text("Auto Submit ON")');
    await menu1.click();
    await optionsPage.waitForTimeout(200);

    const isChecked1 = await autoSubmitCheckbox.isChecked();
    expect(isChecked1).toBe(true);
    console.log('✓ Menu 1 has auto-submit enabled');

    // Switch to second menu
    const menu2 = optionsPage.locator('.menu-item:has-text("Auto Submit OFF")');
    await menu2.click();
    await optionsPage.waitForTimeout(200);

    const isChecked2 = await autoSubmitCheckbox.isChecked();
    expect(isChecked2).toBe(false);
    console.log('✓ Menu 2 has auto-submit disabled');
  });

  test('should maintain selection after page scroll', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Select a menu
    const menuItems = optionsPage.locator('.menu-item');
    const firstMenu = menuItems.first();
    await firstMenu.click();
    await optionsPage.waitForTimeout(200);

    const menuNameInput = optionsPage.locator('#menuName');
    const selectedName = await menuNameInput.inputValue();

    // Scroll down
    await optionsPage.evaluate(() => window.scrollTo(0, 500));
    await optionsPage.waitForTimeout(200);

    // Verify menu is still selected
    await expect(firstMenu).toHaveClass(/selected/);
    const stillSelectedName = await menuNameInput.inputValue();
    expect(stillSelectedName).toBe(selectedName);
    console.log('✓ Selection maintained after scroll');
  });
});
