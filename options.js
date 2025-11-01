import { getConfig, saveConfig, validateConfig } from './config.js';

// ====== DOM ELEMENTS ======
// Menu management
const menuListContainer = document.getElementById('menu-list');
const addMenuButton = document.getElementById('add-menu');
const menuCountDisplay = document.getElementById('menu-count');
const noMenuSelected = document.getElementById('no-menu-selected');
const menuDetailContent = document.getElementById('menu-detail-content');
const deleteMenuButton = document.getElementById('delete-menu');
const menuTemplate = document.getElementById('menu-template');

// Menu configuration
const menuNameInput = document.getElementById('menuName');
const customGptUrlInput = document.getElementById('customGptUrl');
const autoSubmitCheckbox = document.getElementById('autoSubmit');
const runAllEnabledCheckbox = document.getElementById('runAllEnabled');
const runAllShortcutInput = document.getElementById('runAllShortcut');
const runAllShortcutBtn = document.getElementById('runAllShortcutBtn');
const runAllShortcutGroup = document.getElementById('runAllShortcutGroup');

// Actions
const actionsListContainer = document.getElementById('actions-list');
const addActionButton = document.getElementById('add-action');
const actionTemplate = document.getElementById('action-template');

// Global actions
const saveButton = document.getElementById('save');
const exportButton = document.getElementById('export-config');
const importButton = document.getElementById('import-config');
const importFileInput = document.getElementById('import-file-input');

// Banners
const errorBanner = document.getElementById('error-banner');
const warningBanner = document.getElementById('warning-banner');
const successBanner = document.getElementById('success-banner');
const reloadReminder = document.getElementById('reload-reminder');

// ====== STATE ======
let currentConfig = null;
let selectedMenuId = null;
let draggedElement = null;
let draggedMenuElement = null;

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', async () => {
  await loadAndRender();
  attachEventListeners();
});

// ====== LOAD AND RENDER ======
async function loadAndRender() {
  try {
    currentConfig = await getConfig();

    // Render menu list
    renderMenuList();

    // Select first menu by default
    if (currentConfig.menus && currentConfig.menus.length > 0) {
      const firstMenu = currentConfig.menus.sort((a, b) => a.order - b.order)[0];
      selectMenu(firstMenu.id);
    } else {
      // No menus - show empty state
      showNoMenuSelected();
    }

    // Hide banners and reload reminder
    hideAllBanners();
    reloadReminder.classList.add('hidden');
  } catch (e) {
    showError('Failed to load configuration: ' + e.message);
  }
}

// ====== MENU LIST RENDERING ======
function renderMenuList() {
  menuListContainer.innerHTML = '';

  if (!currentConfig.menus || currentConfig.menus.length === 0) {
    updateMenuCount();
    return;
  }

  const sortedMenus = [...currentConfig.menus].sort((a, b) => a.order - b.order);

  sortedMenus.forEach(menu => {
    const menuElement = createMenuElement(menu);
    menuListContainer.appendChild(menuElement);
  });

  updateMenuCount();
}

function createMenuElement(menu) {
  const template = menuTemplate.content.cloneNode(true);
  const menuItem = template.querySelector('.menu-item');

  menuItem.dataset.menuId = menu.id;
  menuItem.querySelector('.menu-name').textContent = menu.name;

  // Mark as selected if this is the currently selected menu
  if (menu.id === selectedMenuId) {
    menuItem.classList.add('selected');
  }

  // Attach click handler
  menuItem.addEventListener('click', () => selectMenu(menu.id));

  // Drag and drop for reordering
  const dragHandle = menuItem.querySelector('.menu-drag-handle');
  dragHandle.addEventListener('mousedown', () => {
    menuItem.draggable = true;
  });

  menuItem.addEventListener('dragstart', handleMenuDragStart);
  menuItem.addEventListener('dragover', handleMenuDragOver);
  menuItem.addEventListener('drop', handleMenuDrop);
  menuItem.addEventListener('dragend', handleMenuDragEnd);

  return menuItem;
}

function updateMenuCount() {
  const count = currentConfig.menus ? currentConfig.menus.length : 0;
  menuCountDisplay.textContent = `${count}/10 menus`;

  // Disable add button if at limit
  if (count >= 10) {
    addMenuButton.disabled = true;
    addMenuButton.title = 'Maximum 10 menus reached';
  } else {
    addMenuButton.disabled = false;
    addMenuButton.title = '';
  }
}

// ====== MENU SELECTION ======
function selectMenu(menuId) {
  selectedMenuId = menuId;

  // Update selected state in sidebar
  menuListContainer.querySelectorAll('.menu-item').forEach(item => {
    if (item.dataset.menuId === menuId) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });

  // Show detail panel
  noMenuSelected.classList.add('hidden');
  menuDetailContent.classList.remove('hidden');

  // Scroll to top of page to show menu details
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Load menu details
  loadMenuDetails(menuId);
}

function showNoMenuSelected() {
  selectedMenuId = null;
  noMenuSelected.classList.remove('hidden');
  menuDetailContent.classList.add('hidden');
}

function loadMenuDetails(menuId) {
  const menu = currentConfig.menus.find(m => m.id === menuId);
  if (!menu) {
    showError('Menu not found');
    return;
  }

  // Populate menu configuration
  menuNameInput.value = menu.name;
  customGptUrlInput.value = menu.customGptUrl;
  autoSubmitCheckbox.checked = menu.autoSubmit;
  runAllEnabledCheckbox.checked = menu.runAllEnabled;
  runAllShortcutInput.value = menu.runAllShortcut || '';

  // Show/hide Run All shortcut based on checkbox
  toggleRunAllShortcutVisibility();

  // Render actions for this menu
  renderActions(menu);
}

// ====== MENU CRUD OPERATIONS ======
function handleAddMenu() {
  if (currentConfig.menus.length >= 10) {
    showError('Maximum 10 menus allowed');
    return;
  }

  // Generate unique ID
  const menuId = `menu_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Create new menu
  const newMenu = {
    id: menuId,
    name: `New Menu ${currentConfig.menus.length + 1}`,
    customGptUrl: 'https://chatgpt.com/g/g-<<YOUR CUSTOM GPT URL>>',
    autoSubmit: true,
    runAllEnabled: false,
    runAllShortcut: '',
    order: currentConfig.menus.length + 1,
    actions: []
  };

  // Add to config
  currentConfig.menus.push(newMenu);

  // Re-render menu list
  renderMenuList();

  // Select the new menu
  selectMenu(menuId);

  // Focus on menu name input
  menuNameInput.focus();
  menuNameInput.select();

  hideAllBanners();
}

async function handleDeleteMenu() {
  if (!selectedMenuId) return;

  const menu = currentConfig.menus.find(m => m.id === selectedMenuId);
  if (!menu) return;

  const actionCount = menu.actions.length;
  const confirmMessage = actionCount > 0
    ? `Delete menu "${menu.name}" and its ${actionCount} action(s)?`
    : `Delete menu "${menu.name}"?`;

  if (!confirm(confirmMessage)) return;

  // Remove menu
  currentConfig.menus = currentConfig.menus.filter(m => m.id !== selectedMenuId);

  // Reorder remaining menus
  currentConfig.menus.forEach((m, index) => {
    m.order = index + 1;
  });

  // Select another menu or show empty state
  if (currentConfig.menus.length > 0) {
    const firstMenu = currentConfig.menus.sort((a, b) => a.order - b.order)[0];
    selectedMenuId = firstMenu.id;
  } else {
    selectedMenuId = null;
  }

  // Save config
  try {
    await saveConfig(currentConfig);

    // Re-render
    renderMenuList();
    if (selectedMenuId) {
      selectMenu(selectedMenuId);
    } else {
      showNoMenuSelected();
    }

    showSuccess(`Menu "${menu.name}" deleted successfully`);
  } catch (e) {
    showError('Failed to delete menu: ' + e.message);
  }
}

// ====== MENU DRAG AND DROP ======
function handleMenuDragStart(e) {
  draggedMenuElement = e.target.closest('.menu-item');
  draggedMenuElement.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleMenuDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  const afterElement = getDragAfterElement(menuListContainer, e.clientY);
  if (afterElement == null) {
    menuListContainer.appendChild(draggedMenuElement);
  } else {
    menuListContainer.insertBefore(draggedMenuElement, afterElement);
  }
}

function handleMenuDrop(e) {
  e.preventDefault();
  updateMenuOrders();
}

function handleMenuDragEnd(e) {
  if (draggedMenuElement) {
    draggedMenuElement.classList.remove('dragging');
    draggedMenuElement.draggable = false;
    draggedMenuElement = null;
  }
}

async function updateMenuOrders() {
  const menuItems = menuListContainer.querySelectorAll('.menu-item');
  menuItems.forEach((item, index) => {
    const menuId = item.dataset.menuId;
    const menu = currentConfig.menus.find(m => m.id === menuId);
    if (menu) {
      menu.order = index + 1;
    }
  });

  // Auto-save the new order
  try {
    await saveConfig(currentConfig);
    showSuccess('Menu order updated');
  } catch (e) {
    showError('Failed to save menu order: ' + e.message);
  }
}

// ====== ACTIONS RENDERING ======
function renderActions(menu) {
  actionsListContainer.innerHTML = '';

  if (!menu.actions || menu.actions.length === 0) {
    return;
  }

  const sortedActions = [...menu.actions].sort((a, b) => a.order - b.order);

  sortedActions.forEach((action, index) => {
    const actionElement = createActionElement(action, index);
    actionsListContainer.appendChild(actionElement);
  });
}

function createActionElement(action, index) {
  const template = actionTemplate.content.cloneNode(true);
  const actionItem = template.querySelector('.action-item');

  actionItem.dataset.actionId = action.id;
  actionItem.dataset.order = action.order;

  const titleInput = actionItem.querySelector('.action-title');
  const promptInput = actionItem.querySelector('.action-prompt');
  const shortcutInput = actionItem.querySelector('.action-shortcut');
  const enabledCheckbox = actionItem.querySelector('.action-enabled');

  titleInput.value = action.title;
  promptInput.value = action.prompt;
  shortcutInput.value = action.shortcut || '';
  enabledCheckbox.checked = action.enabled;

  attachActionEventListeners(actionItem);

  return actionItem;
}

// ====== ACTION EVENT LISTENERS ======
function attachActionEventListeners(actionItem) {
  const moveUpBtn = actionItem.querySelector('[data-action="move-up"]');
  moveUpBtn.addEventListener('click', () => moveActionUp(actionItem));

  const moveDownBtn = actionItem.querySelector('[data-action="move-down"]');
  moveDownBtn.addEventListener('click', () => moveActionDown(actionItem));

  const deleteBtn = actionItem.querySelector('[data-action="delete"]');
  deleteBtn.addEventListener('click', () => deleteAction(actionItem));

  const captureBtn = actionItem.querySelector('.btn-capture');
  const shortcutInput = actionItem.querySelector('.action-shortcut');
  captureBtn.addEventListener('click', () => captureShortcut(shortcutInput));

  shortcutInput.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      shortcutInput.value = '';
      reloadReminder.classList.remove('hidden');
      hideAllBanners();
    }
  });

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

  actionItem.addEventListener('dragstart', handleActionDragStart);
  actionItem.addEventListener('dragover', handleActionDragOver);
  actionItem.addEventListener('drop', handleActionDrop);
  actionItem.addEventListener('dragend', handleActionDragEnd);
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

function handleAddAction() {
  if (!selectedMenuId) {
    showError('Please select a menu first');
    return;
  }

  const menu = currentConfig.menus.find(m => m.id === selectedMenuId);
  if (!menu) return;

  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 7);
  const newId = `action_${timestamp}_${randomStr}`;

  const newAction = {
    id: newId,
    title: 'New Action',
    prompt: '',
    shortcut: '',
    enabled: true,
    order: actionsListContainer.children.length + 1
  };

  const actionElement = createActionElement(newAction, actionsListContainer.children.length);
  actionsListContainer.appendChild(actionElement);

  const titleInput = actionElement.querySelector('.action-title');
  titleInput.focus();
  titleInput.select();
}

// ====== ACTION DRAG AND DROP ======
function handleActionDragStart(e) {
  draggedElement = e.target.closest('.action-item');
  draggedElement.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleActionDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  const afterElement = getDragAfterElement(actionsListContainer, e.clientY);
  if (afterElement == null) {
    actionsListContainer.appendChild(draggedElement);
  } else {
    actionsListContainer.insertBefore(draggedElement, afterElement);
  }
}

function handleActionDrop(e) {
  e.preventDefault();
  updateActionOrders();
}

function handleActionDragEnd(e) {
  if (draggedElement) {
    draggedElement.classList.remove('dragging');
    draggedElement.draggable = false;
    draggedElement = null;
  }
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.action-item:not(.dragging), .menu-item:not(.dragging)')];

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

    const code = e.code;

    if (['ControlLeft', 'ControlRight', 'AltLeft', 'AltRight',
         'ShiftLeft', 'ShiftRight', 'MetaLeft', 'MetaRight'].includes(code)) {
      return;
    }

    const parts = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    if (e.metaKey) parts.push('Meta');

    if (parts.length === 0) {
      shortcutInput.value = '';
      shortcutInput.classList.remove('capturing');
      showError('Shortcut must include at least one modifier key (Ctrl, Alt, Shift, or Meta/Cmd)');
      document.removeEventListener('keydown', handleKeyDown, true);
      return;
    }

    let displayKey;
    if (code.startsWith('Key')) {
      displayKey = code.replace('Key', '');
    } else if (code.startsWith('Digit')) {
      displayKey = code.replace('Digit', '');
    } else if (code.startsWith('Arrow')) {
      displayKey = code.replace('Arrow', '');
    } else {
      displayKey = code;
    }

    parts.push(displayKey);

    const shortcutString = parts.join('+');
    shortcutInput.value = shortcutString;

    reloadReminder.classList.remove('hidden');
    checkShortcutDuplicate(shortcutInput, shortcutString);

    shortcutInput.classList.remove('capturing');
    document.removeEventListener('keydown', handleKeyDown, true);
  };

  document.addEventListener('keydown', handleKeyDown, true);
}

function checkShortcutDuplicate(currentInput, shortcut) {
  if (!shortcut) return;

  // Build a temporary config with current DOM state
  const isRunAllInput = (currentInput === runAllShortcutInput);
  let tempConfig = JSON.parse(JSON.stringify(currentConfig)); // Deep clone

  // Update the current menu with DOM state (in case there are unsaved changes)
  if (selectedMenuId) {
    const menu = tempConfig.menus.find(m => m.id === selectedMenuId);
    if (menu) {
      // Update Run All settings from form
      menu.runAllEnabled = runAllEnabledCheckbox.checked;
      menu.runAllShortcut = runAllShortcutInput.value.trim();

      // Collect current actions from DOM
      menu.actions = [];
      const actionItems = actionsListContainer.querySelectorAll('.action-item');
      actionItems.forEach((item, index) => {
        const actionId = item.dataset.actionId;
        const title = item.querySelector('.action-title').value.trim();
        const shortcutVal = item.querySelector('.action-shortcut').value.trim();

        menu.actions.push({
          id: actionId,
          title: title || 'Unnamed',
          prompt: '',
          shortcut: shortcutVal,
          enabled: true,
          order: index + 1
        });
      });
    }
  }

  // Now update the specific shortcut being set
  if (isRunAllInput) {
    const menu = tempConfig.menus.find(m => m.id === selectedMenuId);
    if (menu) {
      menu.runAllShortcut = shortcut;
    }
  } else {
    const currentActionItem = currentInput.closest('.action-item');
    if (currentActionItem) {
      const actionId = currentActionItem.dataset.actionId;
      const menu = tempConfig.menus.find(m => m.id === selectedMenuId);
      if (menu) {
        const action = menu.actions.find(a => a.id === actionId);
        if (action) {
          action.shortcut = shortcut;
        }
      }
    }
  }

  // Check for conflicts in the simulated config
  const conflicts = checkAllShortcutConflicts(tempConfig);

  if (conflicts.length > 0) {
    // Find the conflict involving this shortcut
    const thisConflict = conflicts.find(c => c.shortcut === shortcut);
    if (thisConflict) {
      const locationDescriptions = thisConflict.locations.map(loc =>
        `"${loc.menuName}" - ${loc.actionTitle}`
      );
      showError(`This shortcut is already used by: ${locationDescriptions.join(' and ')}`);
    }
  } else {
    hideAllBanners();
  }
}

// ====== SHORTCUT CONFLICT DETECTION ======
function checkAllShortcutConflicts(config) {
  const conflicts = [];
  const shortcutMap = new Map(); // shortcut -> array of {menuName, actionTitle, menuId, actionId}

  // Build a map of all shortcuts
  config.menus.forEach(menu => {
    // Check Run All shortcuts
    if (menu.runAllEnabled && menu.runAllShortcut) {
      const shortcut = menu.runAllShortcut;
      if (!shortcutMap.has(shortcut)) {
        shortcutMap.set(shortcut, []);
      }
      shortcutMap.get(shortcut).push({
        menuName: menu.name,
        actionTitle: 'Run All',
        menuId: menu.id,
        actionId: null,
        isRunAll: true
      });
    }

    // Check action shortcuts (only enabled actions with shortcuts matter)
    menu.actions.forEach(action => {
      if (action.shortcut) {
        const shortcut = action.shortcut;
        if (!shortcutMap.has(shortcut)) {
          shortcutMap.set(shortcut, []);
        }
        shortcutMap.get(shortcut).push({
          menuName: menu.name,
          actionTitle: action.title,
          menuId: menu.id,
          actionId: action.id,
          isRunAll: false
        });
      }
    });
  });

  // Find conflicts (shortcuts used more than once)
  shortcutMap.forEach((locations, shortcut) => {
    if (locations.length > 1) {
      conflicts.push({
        shortcut: shortcut,
        locations: locations
      });
    }
  });

  return conflicts;
}

// ====== SAVE MENU ======
async function handleSave() {
  if (!selectedMenuId) {
    showError('No menu selected');
    return;
  }

  try {
    hideAllBanners();

    document.querySelectorAll('.action-title, .action-prompt').forEach(input => {
      input.classList.remove('error');
    });

    const menu = currentConfig.menus.find(m => m.id === selectedMenuId);
    if (!menu) {
      showError('Menu not found');
      return;
    }

    // Update menu configuration from form
    const menuName = menuNameInput.value.trim();
    if (!menuName) {
      menuNameInput.classList.add('error');
      showError('Menu name is required');
      return;
    }

    if (menuName.length > 50) {
      menuNameInput.classList.add('error');
      showError('Menu name must be 50 characters or less');
      return;
    }

    menu.name = menuName;
    menu.customGptUrl = customGptUrlInput.value.trim();
    menu.autoSubmit = autoSubmitCheckbox.checked;
    menu.runAllEnabled = runAllEnabledCheckbox.checked;
    menu.runAllShortcut = runAllShortcutInput.value.trim();

    // Collect actions from DOM
    menu.actions = [];
    let hasEmptyRequiredFields = false;

    const actionItems = actionsListContainer.querySelectorAll('.action-item');
    actionItems.forEach((item, index) => {
      const id = item.dataset.actionId;
      const titleInput = item.querySelector('.action-title');
      const promptInput = item.querySelector('.action-prompt');
      const shortcut = item.querySelector('.action-shortcut').value.trim();
      const enabled = item.querySelector('.action-enabled').checked;

      const title = titleInput.value.trim();
      const prompt = promptInput.value.trim();

      if (!title) {
        titleInput.classList.add('error');
        hasEmptyRequiredFields = true;
      }

      if (!prompt) {
        promptInput.classList.add('error');
        hasEmptyRequiredFields = true;
      }

      menu.actions.push({
        id: id,
        title: title,
        prompt: prompt,
        shortcut: shortcut,
        enabled: enabled,
        order: index + 1
      });
    });

    if (hasEmptyRequiredFields) {
      showError('Please fill in all required fields (Action Title and Prompt)');
      return;
    }

    // Check for placeholder URL
    if (menu.customGptUrl.includes('<<YOUR CUSTOM GPT URL>>')) {
      showError('Please replace "<<YOUR CUSTOM GPT URL>>" with your actual Custom GPT URL');
      return;
    }

    // Check for shortcut conflicts BEFORE saving
    const conflicts = checkAllShortcutConflicts(currentConfig);
    if (conflicts.length > 0) {
      const errorMessages = conflicts.map(conflict => {
        const locationDescriptions = conflict.locations.map(loc =>
          `"${loc.menuName}" - ${loc.actionTitle}`
        );
        return `Shortcut "${conflict.shortcut}" is used by: ${locationDescriptions.join(' and ')}`;
      });
      showError('Shortcut conflicts detected:\n' + errorMessages.join('\n'));
      return;
    }

    // Add version if missing
    if (!currentConfig.version) {
      currentConfig.version = 3;
    }

    // Validate entire config
    const errors = validateConfig(currentConfig);
    if (errors.length > 0) {
      showError('Validation failed: ' + errors.join('; '));
      return;
    }

    // Save
    await saveConfig(currentConfig);

    // Update menu list (name might have changed)
    renderMenuList();

    // Check if there are no actions
    if (menu.actions.length === 0) {
      showWarning(`Menu "${menu.name}" saved successfully! However, you have no actions configured. Add at least one action to use this menu.`);
    } else {
      showSuccess(`Menu "${menu.name}" saved successfully!`);
    }

    // Fade out reload reminder if visible
    if (!reloadReminder.classList.contains('hidden')) {
      setTimeout(() => {
        reloadReminder.classList.add('fading-out');
        setTimeout(() => {
          reloadReminder.classList.add('hidden');
          reloadReminder.classList.remove('fading-out');
        }, 500);
      }, 3000);
    }
  } catch (e) {
    showError('Failed to save: ' + e.message);
  }
}

// ====== EXPORT CONFIGURATION ======
async function handleExport() {
  try {
    const config = await getConfig();

    const jsonStr = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chatgpt-prompts-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess('Configuration exported successfully!');
  } catch (e) {
    showError('Failed to export: ' + e.message);
  }
}

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

    const errors = validateConfig(importedConfig);
    if (errors.length > 0) {
      showError('Invalid configuration file: ' + errors.join('; '));
      importFileInput.value = '';
      return;
    }

    if (!confirm('Import this configuration? Current settings will be replaced.')) {
      importFileInput.value = '';
      return;
    }

    await saveConfig(importedConfig);
    currentConfig = importedConfig;

    await loadAndRender();

    showSuccess('Configuration imported successfully!');
    importFileInput.value = '';
  } catch (e) {
    showError('Failed to import: ' + e.message);
    importFileInput.value = '';
  }
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

  setTimeout(() => {
    warningBanner.classList.add('hidden');
  }, 5000);
}

function showSuccess(message) {
  successBanner.textContent = message;
  successBanner.classList.remove('hidden');
  errorBanner.classList.add('hidden');
  warningBanner.classList.add('hidden');

  setTimeout(() => {
    successBanner.classList.add('hidden');
  }, 3000);
}

function hideAllBanners() {
  errorBanner.classList.add('hidden');
  warningBanner.classList.add('hidden');
  successBanner.classList.add('hidden');
}

// ====== RUN ALL VISIBILITY TOGGLE ======
function toggleRunAllShortcutVisibility() {
  if (runAllEnabledCheckbox.checked) {
    runAllShortcutGroup.style.display = '';
  } else {
    runAllShortcutGroup.style.display = 'none';
  }
}

// ====== ATTACH EVENT LISTENERS ======
function attachEventListeners() {
  // Menu management
  addMenuButton.addEventListener('click', handleAddMenu);
  deleteMenuButton.addEventListener('click', handleDeleteMenu);

  // Menu name real-time update
  menuNameInput.addEventListener('input', () => {
    if (menuNameInput.value.trim()) {
      menuNameInput.classList.remove('error');
    }
  });

  // Actions
  addActionButton.addEventListener('click', handleAddAction);

  // Save
  saveButton.addEventListener('click', handleSave);

  // Export/Import
  exportButton.addEventListener('click', handleExport);
  importButton.addEventListener('click', handleImportClick);
  importFileInput.addEventListener('change', handleImportFile);

  // Run All shortcut capture
  runAllShortcutBtn.addEventListener('click', () => {
    captureShortcut(runAllShortcutInput);
  });

  // Delete key to clear Run All shortcut
  runAllShortcutInput.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      runAllShortcutInput.value = '';
      reloadReminder.classList.remove('hidden');
      hideAllBanners();
    }
  });

  // Toggle Run All shortcut visibility when checkbox changes
  runAllEnabledCheckbox.addEventListener('change', toggleRunAllShortcutVisibility);
}
