import { getConfig, saveConfig, validateConfig } from './config.js';

// ====== DOM ELEMENTS ======
const customGptUrlInput = document.getElementById('customGptUrl');
const contextMenuTitleInput = document.getElementById('contextMenuTitle');
const autoSubmitCheckbox = document.getElementById('autoSubmit');
const runAllEnabledCheckbox = document.getElementById('runAllEnabled');
const runAllShortcutInput = document.getElementById('runAllShortcut');
const runAllShortcutBtn = document.getElementById('runAllShortcutBtn');
const runAllShortcutGroup = document.getElementById('runAllShortcutGroup');
const actionsListContainer = document.getElementById('actions-list');
const addActionButton = document.getElementById('add-action');
const saveButton = document.getElementById('save');
const cancelButton = document.getElementById('cancel');
const exportButton = document.getElementById('export-config');
const importButton = document.getElementById('import-config');
const importFileInput = document.getElementById('import-file-input');
const errorBanner = document.getElementById('error-banner');
const warningBanner = document.getElementById('warning-banner');
const successBanner = document.getElementById('success-banner');
const reloadReminder = document.getElementById('reload-reminder');
const actionTemplate = document.getElementById('action-template');

// ====== STATE ======
let currentConfig = null;
let draggedElement = null;

// ====== LOAD AND RENDER ======
async function loadAndRender() {
  try {
    currentConfig = await getConfig();

    // Populate global settings
    customGptUrlInput.value = currentConfig.globalSettings.customGptUrl;
    contextMenuTitleInput.value = currentConfig.globalSettings.contextMenuTitle;
    autoSubmitCheckbox.checked = currentConfig.globalSettings.autoSubmit;
    runAllEnabledCheckbox.checked = currentConfig.globalSettings.runAllEnabled !== false; // default true
    runAllShortcutInput.value = currentConfig.globalSettings.runAllShortcut || '';

    // Show/hide Run All shortcut based on checkbox
    toggleRunAllShortcutVisibility();

    // Render actions
    renderActions();

    // Hide banners and reload reminder
    hideAllBanners();
    reloadReminder.classList.add('hidden');
  } catch (e) {
    showError('Failed to load configuration: ' + e.message);
  }
}

function renderActions() {
  // Clear current actions
  actionsListContainer.innerHTML = '';

  // Sort actions by order
  const sortedActions = [...currentConfig.actions].sort((a, b) => a.order - b.order);

  // Render each action
  sortedActions.forEach((action, index) => {
    const actionElement = createActionElement(action, index);
    actionsListContainer.appendChild(actionElement);
  });
}

function createActionElement(action, index) {
  // Clone template
  const template = actionTemplate.content.cloneNode(true);
  const actionItem = template.querySelector('.action-item');

  // Set data attributes
  actionItem.dataset.actionId = action.id;
  actionItem.dataset.order = action.order;

  // Populate fields
  const titleInput = actionItem.querySelector('.action-title');
  const promptInput = actionItem.querySelector('.action-prompt');
  const shortcutInput = actionItem.querySelector('.action-shortcut');
  const enabledCheckbox = actionItem.querySelector('.action-enabled');

  titleInput.value = action.title;
  promptInput.value = action.prompt;
  shortcutInput.value = action.shortcut || '';
  enabledCheckbox.checked = action.enabled;

  // Attach event listeners
  attachActionEventListeners(actionItem);

  return actionItem;
}

// ====== ACTION EVENT LISTENERS ======
function attachActionEventListeners(actionItem) {
  // Move up button
  const moveUpBtn = actionItem.querySelector('[data-action="move-up"]');
  moveUpBtn.addEventListener('click', () => moveActionUp(actionItem));

  // Move down button
  const moveDownBtn = actionItem.querySelector('[data-action="move-down"]');
  moveDownBtn.addEventListener('click', () => moveActionDown(actionItem));

  // Delete button
  const deleteBtn = actionItem.querySelector('[data-action="delete"]');
  deleteBtn.addEventListener('click', () => deleteAction(actionItem));

  // Shortcut capture button
  const captureBtn = actionItem.querySelector('.btn-capture');
  const shortcutInput = actionItem.querySelector('.action-shortcut');
  captureBtn.addEventListener('click', () => captureShortcut(shortcutInput));

  // Delete key to clear shortcut
  shortcutInput.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      shortcutInput.value = '';
      // Show reload reminder since shortcut was changed
      reloadReminder.classList.remove('hidden');
      hideAllBanners();
    }
  });

  // Remove error styling when user types in required fields
  const titleInput = actionItem.querySelector('.action-title');
  const promptInput = actionItem.querySelector('.action-prompt');

  titleInput.addEventListener('input', () => {
    if (titleInput.value.trim()) {
      titleInput.classList.remove('error');
    }
  });

  promptInput.addEventListener('input', () => {
    if (promptInput.value.trim()) {
      promptInput.classList.remove('error');
    }
  });

  // Drag and drop
  const dragHandle = actionItem.querySelector('.drag-handle');
  dragHandle.addEventListener('mousedown', () => {
    actionItem.draggable = true;
  });

  actionItem.addEventListener('dragstart', handleDragStart);
  actionItem.addEventListener('dragover', handleDragOver);
  actionItem.addEventListener('drop', handleDrop);
  actionItem.addEventListener('dragend', handleDragEnd);
}

// ====== ACTION MANIPULATION ======
function moveActionUp(actionItem) {
  const previousItem = actionItem.previousElementSibling;
  if (previousItem) {
    actionsListContainer.insertBefore(actionItem, previousItem);
    updateActionOrders();
  }
}

function moveActionDown(actionItem) {
  const nextItem = actionItem.nextElementSibling;
  if (nextItem) {
    actionsListContainer.insertBefore(nextItem, actionItem);
    updateActionOrders();
  }
}

function deleteAction(actionItem) {
  const actionTitle = actionItem.querySelector('.action-title').value || 'this action';

  if (confirm(`Delete "${actionTitle}"?`)) {
    actionItem.remove();
    updateActionOrders();
  }
}

function updateActionOrders() {
  const actionItems = actionsListContainer.querySelectorAll('.action-item');
  actionItems.forEach((item, index) => {
    item.dataset.order = index + 1;
  });
}

// ====== DRAG AND DROP ======
function handleDragStart(e) {
  draggedElement = e.target.closest('.action-item');
  draggedElement.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  const afterElement = getDragAfterElement(actionsListContainer, e.clientY);
  if (afterElement == null) {
    actionsListContainer.appendChild(draggedElement);
  } else {
    actionsListContainer.insertBefore(draggedElement, afterElement);
  }
}

function handleDrop(e) {
  e.preventDefault();
  updateActionOrders();
}

function handleDragEnd(e) {
  if (draggedElement) {
    draggedElement.classList.remove('dragging');
    draggedElement.draggable = false;
    draggedElement = null;
  }
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.action-item:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ====== SHORTCUT CAPTURE ======
function captureShortcut(shortcutInput) {
  shortcutInput.value = 'Press keys...';
  shortcutInput.classList.add('capturing');

  const handleKeyDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Use e.code for physical key (not affected by modifiers on Mac)
    const code = e.code;

    // Ignore if it's just a modifier key by itself
    if (['ControlLeft', 'ControlRight', 'AltLeft', 'AltRight',
         'ShiftLeft', 'ShiftRight', 'MetaLeft', 'MetaRight'].includes(code)) {
      return; // Keep listening for the actual key
    }

    // Build shortcut string
    const parts = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    if (e.metaKey) parts.push('Meta');

    // Require at least one modifier
    if (parts.length === 0) {
      shortcutInput.value = '';
      shortcutInput.classList.remove('capturing');
      showError('Shortcut must include at least one modifier key (Ctrl, Alt, Shift, or Meta/Cmd)');
      document.removeEventListener('keydown', handleKeyDown, true);
      return;
    }

    // Convert code to display key
    // e.code examples: "KeyA", "Digit1", "ArrowUp", "Space", "Enter"
    let displayKey;
    if (code.startsWith('Key')) {
      displayKey = code.replace('Key', ''); // "KeyY" -> "Y"
    } else if (code.startsWith('Digit')) {
      displayKey = code.replace('Digit', ''); // "Digit1" -> "1"
    } else if (code.startsWith('Arrow')) {
      displayKey = code.replace('Arrow', ''); // "ArrowUp" -> "Up"
    } else {
      displayKey = code; // Use as-is for special keys like "Space", "Enter"
    }

    parts.push(displayKey);

    const shortcutString = parts.join('+');
    shortcutInput.value = shortcutString;

    // Show reload reminder since shortcut was changed
    reloadReminder.classList.remove('hidden');

    // Check for duplicates
    checkShortcutDuplicate(shortcutInput, shortcutString);

    shortcutInput.classList.remove('capturing');
    document.removeEventListener('keydown', handleKeyDown, true);
  };

  document.addEventListener('keydown', handleKeyDown, true);
}

function checkShortcutDuplicate(currentInput, shortcut) {
  if (!shortcut) return;

  const allShortcutInputs = document.querySelectorAll('.action-shortcut');
  const currentActionItem = currentInput.closest('.action-item');

  for (const input of allShortcutInputs) {
    const actionItem = input.closest('.action-item');
    const isEnabled = actionItem.querySelector('.action-enabled').checked;

    // Skip if same action or if action is disabled
    if (actionItem === currentActionItem || !isEnabled) continue;

    if (input.value === shortcut) {
      const actionTitle = actionItem.querySelector('.action-title').value;
      showError(`This shortcut is already used by "${actionTitle}"`);
      return;
    }
  }

  hideAllBanners();
}

// ====== BANNER HELPERS ======
function showError(message) {
  errorBanner.textContent = message;
  errorBanner.classList.remove('hidden');
  warningBanner.classList.add('hidden');
  successBanner.classList.add('hidden');
}

function showWarning(message) {
  warningBanner.textContent = message;
  warningBanner.classList.remove('hidden');
  errorBanner.classList.add('hidden');
  successBanner.classList.add('hidden');

  // Auto-hide after 5 seconds (longer than success)
  setTimeout(() => {
    warningBanner.classList.add('hidden');
  }, 5000);
}

function showSuccess(message) {
  successBanner.textContent = message;
  successBanner.classList.remove('hidden');
  errorBanner.classList.add('hidden');
  warningBanner.classList.add('hidden');

  // Auto-hide after 3 seconds
  setTimeout(() => {
    successBanner.classList.add('hidden');
  }, 3000);
}

function hideAllBanners() {
  errorBanner.classList.add('hidden');
  warningBanner.classList.add('hidden');
  successBanner.classList.add('hidden');
}

// ====== SAVE CONFIGURATION ======
async function handleSave() {
  try {
    hideAllBanners();

    // Clear all previous error states
    document.querySelectorAll('.action-title, .action-prompt').forEach(input => {
      input.classList.remove('error');
    });

    // Build config from form and validate required fields
    const newConfig = {
      globalSettings: {
        customGptUrl: customGptUrlInput.value.trim(),
        gptTitleMatch: currentConfig.globalSettings.gptTitleMatch, // Preserved (not in UI)
        contextMenuTitle: contextMenuTitleInput.value.trim(),
        clearContext: currentConfig.globalSettings.clearContext, // Preserved (not in UI)
        autoSubmit: autoSubmitCheckbox.checked,
        runAllEnabled: runAllEnabledCheckbox.checked,
        runAllShortcut: runAllShortcutInput.value.trim()
      },
      actions: []
    };

    // Collect actions from DOM and validate required fields
    const actionItems = actionsListContainer.querySelectorAll('.action-item');
    let hasEmptyRequiredFields = false;

    actionItems.forEach((item, index) => {
      const id = item.dataset.actionId;
      const titleInput = item.querySelector('.action-title');
      const promptInput = item.querySelector('.action-prompt');
      const shortcut = item.querySelector('.action-shortcut').value.trim();
      const enabled = item.querySelector('.action-enabled').checked;

      const title = titleInput.value.trim();
      const prompt = promptInput.value.trim();

      // Validate required fields
      if (!title) {
        titleInput.classList.add('error');
        hasEmptyRequiredFields = true;
      }

      if (!prompt) {
        promptInput.classList.add('error');
        hasEmptyRequiredFields = true;
      }

      newConfig.actions.push({
        id: id,
        title: title,
        prompt: prompt,
        shortcut: shortcut,
        enabled: enabled,
        order: index + 1
      });
    });

    // If there are empty required fields, show error and don't save
    if (hasEmptyRequiredFields) {
      showError('Please fill in all required fields (Action Title and Prompt)');
      return;
    }

    // Check for placeholder URL
    if (newConfig.globalSettings.customGptUrl.includes('<<YOUR CUSTOM GPT URL>>')) {
      showError('Please replace "<<YOUR CUSTOM GPT URL>>" with your actual Custom GPT URL');
      return;
    }

    // Validate
    const errors = validateConfig(newConfig);
    if (errors.length > 0) {
      showError('Validation failed: ' + errors.join('; '));
      return;
    }

    // Save
    await saveConfig(newConfig);
    currentConfig = newConfig;

    // Check if there are no actions - show warning but config is saved
    if (newConfig.actions.length === 0) {
      showWarning('Configuration saved successfully! However, you have no actions configured. Add at least one action to use the extension.');
    } else {
      showSuccess('Configuration saved successfully!');
    }

    // Fade out reload reminder if visible
    if (!reloadReminder.classList.contains('hidden')) {
      setTimeout(() => {
        reloadReminder.classList.add('fading-out');
        // After fade animation completes, add hidden class
        setTimeout(() => {
          reloadReminder.classList.add('hidden');
          reloadReminder.classList.remove('fading-out');
        }, 500); // Match CSS transition duration
      }, 3000); // Wait 3 seconds before starting fade
    }
  } catch (e) {
    showError('Failed to save: ' + e.message);
  }
}

saveButton.addEventListener('click', handleSave);

// ====== ADD ACTION ======
function handleAddAction() {
  // Generate unique ID
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 7);
  const newId = `action_${timestamp}_${randomStr}`;

  // Create new action data
  const newAction = {
    id: newId,
    title: 'New Action',
    prompt: '',
    shortcut: '',
    enabled: true,
    order: actionsListContainer.children.length + 1
  };

  // Create and append element
  const actionElement = createActionElement(newAction, actionsListContainer.children.length);
  actionsListContainer.appendChild(actionElement);

  // Focus on title input
  const titleInput = actionElement.querySelector('.action-title');
  titleInput.focus();
  titleInput.select();
}

addActionButton.addEventListener('click', handleAddAction);

// ====== CANCEL ======
function handleCancel() {
  if (confirm('Discard unsaved changes?')) {
    loadAndRender();
  }
}

cancelButton.addEventListener('click', handleCancel);

// ====== EXPORT CONFIGURATION ======
async function handleExport() {
  try {
    const config = await getConfig();

    // Create JSON blob
    const jsonStr = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chatgpt-actions-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess('Configuration exported successfully!');
  } catch (e) {
    showError('Failed to export: ' + e.message);
  }
}

exportButton.addEventListener('click', handleExport);

// ====== IMPORT CONFIGURATION ======
function handleImportClick() {
  importFileInput.click();
}

async function handleImportFile(e) {
  try {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const importedConfig = JSON.parse(text);

    // Validate imported config
    const errors = validateConfig(importedConfig);
    if (errors.length > 0) {
      showError('Invalid configuration file: ' + errors.join('; '));
      importFileInput.value = ''; // Clear file input
      return;
    }

    // Confirm import
    if (!confirm('Import this configuration? Current settings will be replaced.')) {
      importFileInput.value = '';
      return;
    }

    // Save imported config
    await saveConfig(importedConfig);
    currentConfig = importedConfig;

    // Reload UI
    await loadAndRender();

    showSuccess('Configuration imported successfully!');
    importFileInput.value = ''; // Clear file input
  } catch (e) {
    showError('Failed to import: ' + e.message);
    importFileInput.value = '';
  }
}

importButton.addEventListener('click', handleImportClick);
importFileInput.addEventListener('change', handleImportFile);

// ====== RUN ALL VISIBILITY TOGGLE ======
function toggleRunAllShortcutVisibility() {
  if (runAllEnabledCheckbox.checked) {
    runAllShortcutGroup.style.display = '';
  } else {
    runAllShortcutGroup.style.display = 'none';
  }
}

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', () => {
  loadAndRender();

  // Attach Run All shortcut capture button
  runAllShortcutBtn.addEventListener('click', () => {
    captureShortcut(runAllShortcutInput);
  });

  // Delete key to clear Run All shortcut
  runAllShortcutInput.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      runAllShortcutInput.value = '';
      // Show reload reminder since shortcut was changed
      reloadReminder.classList.remove('hidden');
      hideAllBanners();
    }
  });

  // Toggle Run All shortcut visibility when checkbox changes
  runAllEnabledCheckbox.addEventListener('change', toggleRunAllShortcutVisibility);
});
