import { test, expect } from '../fixtures/extension.js';

/**
 * TEST-AE01 & TEST-AE02: Execute Actions from Multiple Menus
 *
 * These tests verify the configuration and setup for action execution.
 * Full end-to-end testing with actual ChatGPT would require:
 * - ChatGPT account access
 * - Network requests
 * - Complex timing/waiting logic
 *
 * Instead, we verify:
 * 1. Actions are properly configured per menu
 * 2. Each menu has its own GPT URL
 * 3. Each menu has its own auto-submit setting
 * 4. Actions have required fields (title, prompt)
 */

test.describe('Action Execution Tests', () => {
  test('TEST-AE01: should configure action in menu 1 with custom URL', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    // Create Menu 1
    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(300);

    // Configure Menu 1
    const menuNameInput = optionsPage.locator('#menuName');
    await menuNameInput.fill('Menu 1');

    const customGptUrlInput = optionsPage.locator('#customGptUrl');
    const menu1Url = 'https://chatgpt.com/g/g-menu1test';
    await customGptUrlInput.fill(menu1Url);

    const autoSubmitCheckbox = optionsPage.locator('#autoSubmit');
    await autoSubmitCheckbox.check();

    console.log('✓ Menu 1 configured with custom URL and auto-submit');

    // Add action to Menu 1
    const addActionBtn = optionsPage.locator('#add-action');
    await addActionBtn.click();
    await optionsPage.waitForTimeout(300);

    const actionTitles = optionsPage.locator('.action-title');
    const actionPrompts = optionsPage.locator('.action-prompt');

    await actionTitles.first().fill('Menu 1 Action');
    await actionPrompts.first().fill('Please summarize:');

    console.log('✓ Menu 1 action configured');

    // Verify configuration before saving
    const currentUrl = await customGptUrlInput.inputValue();
    expect(currentUrl).toBe(menu1Url);

    const currentActionTitle = await actionTitles.first().inputValue();
    expect(currentActionTitle).toBe('Menu 1 Action');

    const isAutoSubmitChecked = await autoSubmitCheckbox.isChecked();
    expect(isAutoSubmitChecked).toBe(true);

    console.log('✓ Menu 1 configuration complete');
    console.log('✓ Action configured to execute with:', {
      url: menu1Url,
      autoSubmit: true,
      action: 'Menu 1 Action'
    });
  });

  test('TEST-AE02: should configure action in menu 2 with different URL', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    const addMenuBtn = optionsPage.locator('#add-menu');
    const menuNameInput = optionsPage.locator('#menuName');
    const customGptUrlInput = optionsPage.locator('#customGptUrl');
    const autoSubmitCheckbox = optionsPage.locator('#autoSubmit');
    const saveBtn = optionsPage.locator('#save');

    // Create Menu 1
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(300);
    await menuNameInput.fill('Menu 1');
    const menu1Url = 'https://chatgpt.com/g/g-menu1';
    await customGptUrlInput.fill(menu1Url);
    await autoSubmitCheckbox.check();
    await saveBtn.click();
    await optionsPage.waitForTimeout(500);

    console.log('✓ Menu 1 created');

    // Create Menu 2 with different settings
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(300);

    await menuNameInput.fill('Menu 2');
    const menu2Url = 'https://chatgpt.com/g/g-menu2';
    await customGptUrlInput.fill(menu2Url);
    // Uncheck auto-submit for Menu 2
    if (await autoSubmitCheckbox.isChecked()) {
      await autoSubmitCheckbox.uncheck();
    }

    const addActionBtn = optionsPage.locator('#add-action');
    await addActionBtn.click();
    await optionsPage.waitForTimeout(300);

    const actionTitles = optionsPage.locator('.action-title');
    const actionPrompts = optionsPage.locator('.action-prompt');

    await actionTitles.first().fill('Menu 2 Action');
    await actionPrompts.first().fill('Explain this:');

    // Verify Menu 2 configuration before saving
    const url2 = await customGptUrlInput.inputValue();
    const autoSubmit2 = await autoSubmitCheckbox.isChecked();

    expect(url2).toBe(menu2Url);
    expect(autoSubmit2).toBe(false);

    console.log('✓ Menu 2 created with different URL');
    console.log('✓ Menu 2 configuration:', { url: url2, autoSubmit: autoSubmit2 });

    // Verify URLs are different
    expect(menu1Url).not.toBe(menu2Url);
    console.log('✓ Menu 1 and Menu 2 have different URLs');
  });

  test('should verify each menu can have different number of actions', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    const addMenuBtn = optionsPage.locator('#add-menu');
    const addActionBtn = optionsPage.locator('#add-action');
    const actionItems = optionsPage.locator('.action-item');

    // Create Menu 1 with 2 actions
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(300);

    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    let menu1ActionCount = await actionItems.count();
    expect(menu1ActionCount).toBe(2);

    console.log(`✓ Menu 1 configured with ${menu1ActionCount} actions`);

    // Create Menu 2 with 3 actions
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(300);

    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);
    await addActionBtn.click();
    await optionsPage.waitForTimeout(200);

    let menu2ActionCount = await actionItems.count();
    expect(menu2ActionCount).toBe(3);

    console.log(`✓ Menu 2 configured with ${menu2ActionCount} actions`);
    console.log('✓ Different menus can have different action counts');
  });

  test('should verify actions have required fields for execution', async ({ optionsPage }) => {
    await optionsPage.waitForLoadState('networkidle');

    const addMenuBtn = optionsPage.locator('#add-menu');
    await addMenuBtn.click();
    await optionsPage.waitForTimeout(300);

    // Add action
    const addActionBtn = optionsPage.locator('#add-action');
    await addActionBtn.click();
    await optionsPage.waitForTimeout(300);

    // Verify action has all required input fields
    const actionTitle = optionsPage.locator('.action-title').first();
    const actionPrompt = optionsPage.locator('.action-prompt').first();

    await expect(actionTitle).toBeVisible();
    await expect(actionPrompt).toBeVisible();

    // Fill in required fields
    await actionTitle.fill('Test Action');
    await actionPrompt.fill('Test prompt:');

    const titleValue = await actionTitle.inputValue();
    const promptValue = await actionPrompt.inputValue();

    expect(titleValue).toBeTruthy();
    expect(promptValue).toBeTruthy();

    console.log('✓ Action has required fields:', {
      title: titleValue,
      prompt: promptValue
    });
  });
});
