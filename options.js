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
  // Event listeners will be added in Task 6
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
