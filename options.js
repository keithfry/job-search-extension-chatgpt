import { getConfig, saveConfig, validateConfig } from './config.js';

// ====== DOM ELEMENTS ======
const customGptUrlInput = document.getElementById('customGptUrl');
const gptTitleMatchInput = document.getElementById('gptTitleMatch');
const clearContextCheckbox = document.getElementById('clearContext');
const autoSubmitCheckbox = document.getElementById('autoSubmit');
const actionsListContainer = document.getElementById('actions-list');
const addActionButton = document.getElementById('add-action');
const saveButton = document.getElementById('save');
const cancelButton = document.getElementById('cancel');
const exportButton = document.getElementById('export-config');
const importButton = document.getElementById('import-config');
const importFileInput = document.getElementById('import-file-input');
const errorBanner = document.getElementById('error-banner');
const successBanner = document.getElementById('success-banner');
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
    gptTitleMatchInput.value = currentConfig.globalSettings.gptTitleMatch;
    clearContextCheckbox.checked = currentConfig.globalSettings.clearContext;
    autoSubmitCheckbox.checked = currentConfig.globalSettings.autoSubmit;

    // Render actions
    renderActions();

    hideAllBanners();
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
    // Check if this is the last action
    if (actionsListContainer.children.length <= 1) {
      showError('Cannot delete the last action. At least one action is required.');
      return;
    }

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

    // Get the key (ignore modifiers themselves)
    const key = e.key;
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
      const displayKey = key.length === 1 ? key.toUpperCase() : key;
      parts.push(displayKey);

      const shortcutString = parts.join('+');
      shortcutInput.value = shortcutString;

      // Check for duplicates
      checkShortcutDuplicate(shortcutInput, shortcutString);
    }

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
  successBanner.classList.add('hidden');
}

function showSuccess(message) {
  successBanner.textContent = message;
  successBanner.classList.remove('hidden');
  errorBanner.classList.add('hidden');

  // Auto-hide after 3 seconds
  setTimeout(() => {
    successBanner.classList.add('hidden');
  }, 3000);
}

function hideAllBanners() {
  errorBanner.classList.add('hidden');
  successBanner.classList.add('hidden');
}

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', loadAndRender);
