# Configurable Actions Extension - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the ChatGPT Actions extension from hardcoded actions to a fully configurable system with options page, custom shortcuts, and JSON import/export.

**Architecture:** Storage-Driven Dynamic System using chrome.storage.sync as source of truth, with reactive updates triggering context menu and keyboard shortcut rebuilds. Custom keyboard handler in content script enables unlimited shortcuts.

**Tech Stack:** Chrome Extension Manifest V3, ES6 JavaScript modules, chrome.storage.sync API, chrome.contextMenus API, vanilla HTML/CSS/JS for options page.

---

## Task 1: Update manifest.json for new permissions and structure

**Files:**
- Modify: `manifest.json`

**Step 1: Add storage permission and content scripts**

Update manifest.json to version 2.0.0 with new permissions:

```json
{
  "manifest_version": 3,
  "name": "ChatGPT Actions",
  "version": "2.0.0",
  "description": "Configurable actions to send selections to your custom ChatGPT assistant.",
  "permissions": [
    "contextMenus",
    "tabs",
    "scripting",
    "activeTab",
    "storage"
  ],
  "host_permissions": [
    "https://chatgpt.com/*",
    "https://chat.openai.com/*"
  ],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["shortcuts.js"],
      "run_at": "document_start"
    }
  ],
  "options_page": "options.html"
}
```

**Step 2: Verify manifest syntax**

Load extension in Chrome:
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `.worktrees/feature/custom-configuration` directory

Expected: Extension loads without errors (service worker will error until we create config.js - that's OK)

**Step 3: Commit**

```bash
git add manifest.json
git commit -m "Update manifest to v2.0.0 with storage permission and content scripts

- Add storage permission for chrome.storage.sync
- Add content_scripts for shortcuts.js
- Add options_page for configuration UI
- Enable ES6 modules in background script
- Remove commands API (replaced by custom shortcut system)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Create config.js module with validation and defaults

**Files:**
- Create: `config.js`

**Step 1: Write DEFAULT_CONFIG constant**

Create `config.js` with default configuration matching current v1.6.0 hardcoded values:

```javascript
// ====== DEFAULT CONFIGURATION ======
const DEFAULT_CONFIG = {
  globalSettings: {
    customGptUrl: "https://chatgpt.com/g/g-68b0b1831c0c819186bcf8bc0ecef4fa-keith-fry-s-job-match-and-cover-letter-coach",
    gptTitleMatch: "ChatGPT - Keith Fry's Job Match and Cover Letter Coach",
    clearContext: true,
    autoSubmit: true
  },
  actions: [
    {
      id: "fitMatch",
      title: "Fit Match",
      prompt: "Create a Fit Match, do not create a cover letter:",
      shortcut: "Alt+Shift+J",
      enabled: true,
      order: 1
    },
    {
      id: "jobSummary",
      title: "Job Summary",
      prompt: "Create a Job Summary in 5 sentences for following position:",
      shortcut: "Alt+Shift+K",
      enabled: true,
      order: 2
    },
    {
      id: "criticalFitMatch",
      title: "Critical Fit Match",
      prompt: "think long, be critical, and provide a Fit Match with no cover letter:",
      shortcut: "Alt+Shift+L",
      enabled: true,
      order: 3
    }
  ]
};
```

**Step 2: Write validation function**

Add comprehensive validation logic:

```javascript
// ====== VALIDATION ======
function validateConfig(config) {
  const errors = [];

  // Validate structure
  if (!config || typeof config !== 'object') {
    return ['Configuration must be an object'];
  }

  // Global settings validation
  if (!config.globalSettings) {
    errors.push('Missing globalSettings');
  } else {
    if (!config.globalSettings.customGptUrl?.startsWith('https://chatgpt.com/')) {
      errors.push('Custom GPT URL must start with https://chatgpt.com/');
    }
    if (!config.globalSettings.gptTitleMatch?.trim()) {
      errors.push('GPT Title Match is required');
    }
    if (typeof config.globalSettings.clearContext !== 'boolean') {
      errors.push('clearContext must be true or false');
    }
    if (typeof config.globalSettings.autoSubmit !== 'boolean') {
      errors.push('autoSubmit must be true or false');
    }
  }

  // Actions validation
  if (!Array.isArray(config.actions)) {
    errors.push('actions must be an array');
  } else if (config.actions.length === 0) {
    errors.push('At least one action is required');
  } else {
    config.actions.forEach((action, index) => {
      if (!action.id || !/^[a-zA-Z0-9_-]+$/.test(action.id)) {
        errors.push(`Action ${index + 1}: Invalid ID format (alphanumeric, dash, underscore only)`);
      }
      if (!action.title?.trim()) {
        errors.push(`Action ${index + 1}: Title is required`);
      }
      if (!action.prompt?.trim()) {
        errors.push(`Action ${index + 1}: Prompt is required`);
      }
      if (typeof action.enabled !== 'boolean') {
        errors.push(`Action ${index + 1}: enabled must be true or false`);
      }
      if (typeof action.order !== 'number') {
        errors.push(`Action ${index + 1}: order must be a number`);
      }
    });

    // Check for duplicate IDs
    const ids = config.actions.map(a => a.id);
    const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (duplicateIds.length) {
      errors.push(`Duplicate action IDs: ${[...new Set(duplicateIds)].join(', ')}`);
    }

    // Check for duplicate shortcuts (among enabled actions only)
    const enabledShortcuts = config.actions
      .filter(a => a.enabled && a.shortcut?.trim())
      .map(a => a.shortcut);
    const duplicateShortcuts = enabledShortcuts.filter((s, i) => enabledShortcuts.indexOf(s) !== i);
    if (duplicateShortcuts.length) {
      errors.push(`Duplicate shortcuts: ${[...new Set(duplicateShortcuts)].join(', ')}`);
    }
  }

  return errors;
}
```

**Step 3: Write getConfig function**

Add function to load config with fallback to defaults:

```javascript
// ====== GET CONFIGURATION ======
async function getConfig() {
  try {
    const { config } = await chrome.storage.sync.get('config');

    if (!config) {
      console.log('[Config] No config found, using defaults');
      return DEFAULT_CONFIG;
    }

    // Validate loaded config
    const errors = validateConfig(config);
    if (errors.length > 0) {
      console.error('[Config] Validation failed, using defaults:', errors);
      return DEFAULT_CONFIG;
    }

    return config;
  } catch (e) {
    console.error('[Config] Error loading config, using defaults:', e);
    return DEFAULT_CONFIG;
  }
}
```

**Step 4: Write saveConfig function**

Add function to validate and save config:

```javascript
// ====== SAVE CONFIGURATION ======
async function saveConfig(config) {
  // Validate before saving
  const errors = validateConfig(config);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join('; ')}`);
  }

  // Save to storage
  await chrome.storage.sync.set({ config });
  console.log('[Config] Saved successfully');
}
```

**Step 5: Write migrateConfig function**

Add one-time migration for v1.6.0 users:

```javascript
// ====== MIGRATION ======
async function migrateConfig() {
  const { config } = await chrome.storage.sync.get('config');

  // Already has new config format
  if (config) {
    console.log('[Config] Already migrated');
    return;
  }

  // First time running v2.0.0 - create default config
  console.log('[Config] Migrating to v2.0.0...');
  await chrome.storage.sync.set({ config: DEFAULT_CONFIG });
  console.log('[Config] Migration complete');
}
```

**Step 6: Export functions**

Add exports at end of file:

```javascript
// ====== EXPORTS ======
export { DEFAULT_CONFIG, validateConfig, getConfig, saveConfig, migrateConfig };
```

**Step 7: Verify syntax**

Reload extension in Chrome:
1. Go to `chrome://extensions/`
2. Click "Reload" button for extension

Expected: Extension still loads (background.js will still error - that's OK)

**Step 8: Commit**

```bash
git add config.js
git commit -m "Add config module with validation and storage functions

- DEFAULT_CONFIG with current hardcoded values as defaults
- validateConfig with comprehensive validation rules
- getConfig with fallback to defaults
- saveConfig with validation before write
- migrateConfig for v1.6.0 -> v2.0.0 users

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Create options.html structure

**Files:**
- Create: `options.html`

**Step 1: Write HTML structure with global settings section**

Create `options.html` with complete structure:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ChatGPT Actions - Configuration</title>
  <link rel="stylesheet" href="options.css">
</head>
<body>
  <div class="container">
    <header>
      <h1>ChatGPT Actions</h1>
      <p class="subtitle">Configuration</p>
    </header>

    <!-- Error banner (hidden by default) -->
    <div id="error-banner" class="error-banner hidden"></div>

    <!-- Success banner (hidden by default) -->
    <div id="success-banner" class="success-banner hidden"></div>

    <!-- Global Settings Section -->
    <section class="settings-section">
      <h2>Global Settings</h2>
      <div class="form-group">
        <label for="customGptUrl">Custom GPT URL</label>
        <input
          type="url"
          id="customGptUrl"
          placeholder="https://chatgpt.com/g/g-..."
          required
        />
        <small>The URL of your custom ChatGPT assistant</small>
      </div>

      <div class="form-group">
        <label for="gptTitleMatch">GPT Tab Title Match</label>
        <input
          type="text"
          id="gptTitleMatch"
          placeholder="ChatGPT - Your GPT Name"
          required
        />
        <small>Browser tab title to match when finding existing GPT tabs</small>
      </div>

      <div class="form-group checkboxes">
        <label>
          <input type="checkbox" id="clearContext" />
          <span>Clear Context</span>
          <small>Start fresh conversation each time</small>
        </label>

        <label>
          <input type="checkbox" id="autoSubmit" />
          <span>Auto Submit</span>
          <small>Automatically submit prompts without manual send</small>
        </label>
      </div>
    </section>

    <!-- Actions Section -->
    <section class="actions-section">
      <div class="section-header">
        <h2>Actions</h2>
        <button id="add-action" class="btn-secondary">+ Add Action</button>
      </div>

      <div id="actions-list">
        <!-- Actions will be dynamically inserted here -->
      </div>
    </section>

    <!-- Import/Export Section -->
    <section class="import-export-section">
      <button id="export-config" class="btn-secondary">Export JSON</button>
      <button id="import-config" class="btn-secondary">Import JSON</button>
      <input type="file" id="import-file-input" accept=".json" style="display: none;" />
    </section>

    <!-- Save/Cancel Buttons -->
    <footer class="footer">
      <button id="save" class="btn-primary">Save</button>
      <button id="cancel" class="btn-secondary">Cancel</button>
    </footer>
  </div>

  <!-- Action Item Template (hidden) -->
  <template id="action-template">
    <div class="action-item" data-action-id="">
      <div class="action-header">
        <span class="drag-handle" title="Drag to reorder">≡</span>
        <input type="text" class="action-title" placeholder="Action Title" />
        <div class="action-controls">
          <button class="btn-icon" data-action="move-up" title="Move up">↑</button>
          <button class="btn-icon" data-action="move-down" title="Move down">↓</button>
          <button class="btn-icon btn-delete" data-action="delete" title="Delete">×</button>
        </div>
      </div>
      <div class="action-body">
        <div class="form-group">
          <label>Prompt</label>
          <input type="text" class="action-prompt" placeholder="Message to send to GPT..." />
        </div>
        <div class="form-group shortcut-group">
          <label>Keyboard Shortcut</label>
          <div class="shortcut-capture">
            <input type="text" class="action-shortcut" placeholder="None" readonly />
            <button class="btn-icon btn-capture" title="Record shortcut">⌨️</button>
          </div>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" class="action-enabled" />
            <span>Enabled</span>
          </label>
        </div>
      </div>
    </div>
  </template>

  <script type="module" src="options.js"></script>
</body>
</html>
```

**Step 2: Verify HTML loads**

Open options page:
1. Go to `chrome://extensions/`
2. Find "ChatGPT Actions"
3. Click "Extension options"

Expected: Page opens but shows unstyled HTML (CSS not created yet - that's OK)

**Step 3: Commit**

```bash
git add options.html
git commit -m "Add options page HTML structure

- Global settings form (GPT URL, title match, checkboxes)
- Actions section with dynamic list placeholder
- Import/Export buttons
- Save/Cancel footer
- Action template for dynamic rendering

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Create options.css styling

**Files:**
- Create: `options.css`

**Step 1: Write CSS for layout and components**

Create `options.css` with clean, minimal styling:

```css
/* ====== RESET & BASE ====== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  background: #f5f5f5;
  padding: 20px;
}

/* ====== CONTAINER ====== */
.container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 32px;
}

/* ====== HEADER ====== */
header {
  margin-bottom: 32px;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 16px;
}

header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1a73e8;
}

header .subtitle {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

/* ====== BANNERS ====== */
.error-banner,
.success-banner {
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
}

.error-banner {
  background: #fce4e4;
  border: 1px solid #fcc2c3;
  color: #cc0033;
}

.success-banner {
  background: #e6f4ea;
  border: 1px solid #81c995;
  color: #137333;
}

.hidden {
  display: none;
}

/* ====== SECTIONS ====== */
.settings-section,
.actions-section,
.import-export-section {
  margin-bottom: 32px;
}

h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #202124;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

/* ====== FORM GROUPS ====== */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 6px;
  color: #5f6368;
}

.form-group input[type="text"],
.form-group input[type="url"] {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-group input[type="text"]:focus,
.form-group input[type="url"]:focus {
  outline: none;
  border-color: #1a73e8;
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
}

.form-group input[type="text"].error,
.form-group input[type="url"].error {
  border-color: #d93025;
}

.form-group small {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}

/* ====== CHECKBOXES ====== */
.form-group.checkboxes label {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  cursor: pointer;
}

.form-group.checkboxes input[type="checkbox"] {
  margin-right: 8px;
  margin-top: 2px;
  cursor: pointer;
}

.form-group.checkboxes span {
  font-weight: 500;
  color: #5f6368;
}

.form-group.checkboxes small {
  margin-left: 24px;
  margin-top: 0;
}

/* ====== ACTIONS LIST ====== */
#actions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-item {
  border: 1px solid #dadce0;
  border-radius: 6px;
  padding: 16px;
  background: #f8f9fa;
  transition: box-shadow 0.2s;
}

.action-item:hover {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.action-item.dragging {
  opacity: 0.5;
}

/* ====== ACTION HEADER ====== */
.action-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.drag-handle {
  font-size: 20px;
  color: #999;
  cursor: move;
  user-select: none;
  padding: 4px;
}

.drag-handle:hover {
  color: #666;
}

.action-title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  padding: 6px 10px;
  border: 1px solid #dadce0;
  border-radius: 4px;
}

.action-controls {
  display: flex;
  gap: 4px;
}

/* ====== ACTION BODY ====== */
.action-body {
  padding-left: 32px;
}

.action-body .form-group {
  margin-bottom: 12px;
}

.action-body .action-prompt {
  width: 100%;
}

/* ====== SHORTCUT CAPTURE ====== */
.shortcut-group {
  max-width: 300px;
}

.shortcut-capture {
  display: flex;
  gap: 8px;
}

.shortcut-capture input {
  flex: 1;
  background: #fff;
  cursor: default;
}

.shortcut-capture input.capturing {
  border-color: #1a73e8;
  background: #e8f0fe;
}

/* ====== BUTTONS ====== */
.btn-primary,
.btn-secondary,
.btn-icon {
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.1s;
}

.btn-primary {
  background: #1a73e8;
  color: white;
  padding: 10px 24px;
}

.btn-primary:hover {
  background: #1557b0;
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-primary:disabled {
  background: #dadce0;
  color: #999;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #1a73e8;
  border: 1px solid #dadce0;
  padding: 8px 16px;
}

.btn-secondary:hover {
  background: #f8f9fa;
  border-color: #1a73e8;
}

.btn-icon {
  background: transparent;
  color: #5f6368;
  padding: 4px 8px;
  font-size: 16px;
  min-width: 32px;
}

.btn-icon:hover {
  background: #e8eaed;
  color: #202124;
}

.btn-delete {
  color: #d93025;
}

.btn-delete:hover {
  background: #fce4e4;
  color: #a50e0e;
}

.btn-capture {
  font-size: 18px;
}

/* ====== IMPORT/EXPORT SECTION ====== */
.import-export-section {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

/* ====== FOOTER ====== */
.footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
}

/* ====== RESPONSIVE ====== */
@media (max-width: 768px) {
  body {
    padding: 12px;
  }

  .container {
    padding: 20px;
  }

  .action-body {
    padding-left: 0;
  }

  .import-export-section {
    flex-direction: column;
  }
}
```

**Step 2: Verify styling**

Reload options page:
1. Go to `chrome://extensions/`
2. Click "Extension options" for the extension

Expected: Page now has clean styling, proper layout, blue header

**Step 3: Commit**

```bash
git add options.css
git commit -m "Add options page styling

- Clean, minimal design matching Chrome extension style
- Responsive layout with max-width container
- Action items with hover effects
- Button states and transitions
- Error/success banner styles

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Create options.js logic (Part 1: Load and render)

**Files:**
- Create: `options.js`

**Step 1: Write imports and DOM element references**

Create `options.js` starting with setup:

```javascript
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
```

**Step 2: Write loadAndRender function**

Add function to load config and populate UI:

```javascript
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
```

**Step 3: Write createActionElement function**

Add function to create action item from template:

```javascript
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
```

**Step 4: Write banner helper functions**

Add functions to show/hide banners:

```javascript
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
```

**Step 5: Write initialization**

Add initialization at end of file:

```javascript
// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', loadAndRender);
```

**Step 6: Verify options page loads config**

1. Reload extension: `chrome://extensions/` → Reload button
2. Open options page: Extension options
3. Open browser console (F12)

Expected:
- Console shows "[Config] Migrating to v2.0.0..." and "[Config] Migration complete"
- Form fields populated with default values
- Actions list shows 3 actions (Fit Match, Job Summary, Critical Fit Match)

**Step 7: Commit**

```bash
git add options.js
git commit -m "Add options.js with config loading and rendering

- Import config module functions
- loadAndRender to populate form from storage
- renderActions to dynamically create action items
- createActionElement using template cloning
- Banner helper functions for errors/success
- DOM initialization

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Create options.js logic (Part 2: Event handlers)

**Files:**
- Modify: `options.js`

**Step 1: Write attachActionEventListeners function**

Add event listener attachment for action items (insert before initialization section):

```javascript
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
```

**Step 2: Write action manipulation functions**

Add functions to move and delete actions:

```javascript
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
```

**Step 3: Write drag-and-drop handlers**

Add drag-and-drop functionality:

```javascript
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
```

**Step 4: Write shortcut capture function**

Add keyboard shortcut capture:

```javascript
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
```

**Step 5: Verify event handlers work**

1. Reload extension
2. Open options page
3. Test:
   - Click up/down arrows on actions → should reorder
   - Try to delete last action → should show error
   - Click keyboard icon → should show "Press keys..."
   - Press Alt+Shift+M → should capture "Alt+Shift+M"
   - Try same shortcut on another action → should show duplicate error

Expected: All interactions work as described

**Step 6: Commit**

```bash
git add options.js
git commit -m "Add event handlers for action manipulation

- Move up/down buttons with reordering
- Delete action with confirmation and validation
- Drag-and-drop reordering support
- Keyboard shortcut capture with modifier validation
- Duplicate shortcut detection

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Create options.js logic (Part 3: Save, add, import/export)

**Files:**
- Modify: `options.js`

**Step 1: Write save functionality**

Add save button handler (insert before initialization):

```javascript
// ====== SAVE CONFIGURATION ======
async function handleSave() {
  try {
    hideAllBanners();

    // Build config from form
    const newConfig = {
      globalSettings: {
        customGptUrl: customGptUrlInput.value.trim(),
        gptTitleMatch: gptTitleMatchInput.value.trim(),
        clearContext: clearContextCheckbox.checked,
        autoSubmit: autoSubmitCheckbox.checked
      },
      actions: []
    };

    // Collect actions from DOM
    const actionItems = actionsListContainer.querySelectorAll('.action-item');
    actionItems.forEach((item, index) => {
      const id = item.dataset.actionId;
      const title = item.querySelector('.action-title').value.trim();
      const prompt = item.querySelector('.action-prompt').value.trim();
      const shortcut = item.querySelector('.action-shortcut').value.trim();
      const enabled = item.querySelector('.action-enabled').checked;

      newConfig.actions.push({
        id: id,
        title: title,
        prompt: prompt,
        shortcut: shortcut,
        enabled: enabled,
        order: index + 1
      });
    });

    // Validate
    const errors = validateConfig(newConfig);
    if (errors.length > 0) {
      showError('Validation failed: ' + errors.join('; '));
      return;
    }

    // Save
    await saveConfig(newConfig);
    currentConfig = newConfig;

    showSuccess('Configuration saved successfully!');
  } catch (e) {
    showError('Failed to save: ' + e.message);
  }
}

saveButton.addEventListener('click', handleSave);
```

**Step 2: Write add action functionality**

Add new action button handler:

```javascript
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
```

**Step 3: Write cancel functionality**

Add cancel button handler:

```javascript
// ====== CANCEL ======
function handleCancel() {
  if (confirm('Discard unsaved changes?')) {
    loadAndRender();
  }
}

cancelButton.addEventListener('click', handleCancel);
```

**Step 4: Write export functionality**

Add export button handler:

```javascript
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
```

**Step 5: Write import functionality**

Add import button and file input handlers:

```javascript
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
```

**Step 6: Verify save, add, import/export work**

1. Reload extension
2. Open options page
3. Test:
   - Click "Add Action" → new action appears
   - Edit values, click Save → success message appears
   - Reload page → values persist
   - Click Export → JSON file downloads
   - Edit action, click Cancel → confirm dialog, values reset
   - Click Import, select exported file → config loads

Expected: All functionality works

**Step 7: Commit**

```bash
git add options.js
git commit -m "Add save, add action, cancel, and import/export functionality

- handleSave collects form data and validates before saving
- handleAddAction creates new action with unique ID
- handleCancel discards changes with confirmation
- handleExport downloads config as JSON file
- handleImport loads and validates JSON file

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Create shortcuts.js content script

**Files:**
- Create: `shortcuts.js`

**Step 1: Write shortcut normalization and state**

Create `shortcuts.js` with keyboard event handling:

```javascript
// ====== STATE ======
let shortcutMap = new Map(); // "Alt+Shift+J" → "fitMatch"

// ====== SHORTCUT NORMALIZATION ======
function normalizeShortcut(event) {
  const parts = [];

  // Add modifiers in consistent order
  if (event.ctrlKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');
  if (event.metaKey) parts.push('Meta');

  // Get the key
  const key = event.key;

  // Normalize key display
  const displayKey = key.length === 1 ? key.toUpperCase() : key;
  parts.push(displayKey);

  return parts.join('+');
}
```

**Step 2: Write message handlers for loading shortcuts**

Add message passing to get shortcuts from background:

```javascript
// ====== LOAD SHORTCUTS FROM BACKGROUND ======
function loadShortcuts() {
  chrome.runtime.sendMessage({ type: 'GET_SHORTCUTS' }, (response) => {
    if (response && response.shortcuts) {
      shortcutMap = new Map(response.shortcuts);
      console.log('[Shortcuts] Loaded', shortcutMap.size, 'shortcuts');
    }
  });
}

// Listen for shortcut updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SHORTCUTS_UPDATED') {
    shortcutMap = new Map(message.shortcuts);
    console.log('[Shortcuts] Updated', shortcutMap.size, 'shortcuts');
  }
});
```

**Step 3: Write keydown listener**

Add global keyboard event listener:

```javascript
// ====== KEYBOARD LISTENER ======
document.addEventListener('keydown', (event) => {
  // Don't interfere with input fields
  const target = event.target;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return;
  }

  const shortcut = normalizeShortcut(event);
  const actionId = shortcutMap.get(shortcut);

  if (actionId) {
    console.log('[Shortcuts] Triggered:', shortcut, '→', actionId);
    event.preventDefault();
    event.stopPropagation();

    // Send message to background to execute action
    chrome.runtime.sendMessage({
      type: 'EXECUTE_SHORTCUT',
      actionId: actionId
    });
  }
}, true); // Use capture phase to intercept early
```

**Step 4: Write initialization**

Add initialization call:

```javascript
// ====== INITIALIZATION ======
loadShortcuts();
```

**Step 5: Verify shortcuts.js loads**

1. Reload extension
2. Open any webpage
3. Open browser console (F12)
4. Look for "[Shortcuts] Loaded..." message

Expected: Console shows shortcuts loaded (might show 0 shortcuts if background.js not updated yet - that's OK)

**Step 6: Commit**

```bash
git add shortcuts.js
git commit -m "Add shortcuts.js content script for keyboard handling

- normalizeShortcut converts keyboard events to string format
- loadShortcuts requests shortcut map from background
- Global keydown listener matches shortcuts and triggers actions
- Message passing for SHORTCUTS_UPDATED events
- Skips keyboard handling when in input fields

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 9: Refactor background.js (Part 1: Setup and initialization)

**Files:**
- Modify: `background.js`

**Step 1: Add imports and remove hardcoded config**

Replace the entire config section at top of background.js:

OLD:
```javascript
// ====== CONFIG ======
const CUSTOM_GPT_URL = "...";
const GPT_TITLE_MATCH = "...";
const CLEAR_CONTEXT = true;
const AUTO_SUBMIT = true;
const ACTIONS = {...};
```

NEW:
```javascript
import { getConfig, migrateConfig } from './config.js';

// ====== DYNAMIC CONFIG ======
// Config is now loaded from chrome.storage.sync
// No hardcoded values - everything is user-configurable
```

**Step 2: Add config caching**

Add cache variable after imports:

```javascript
// ====== CONFIG CACHE ======
let cachedConfig = null;

async function loadConfig() {
  if (!cachedConfig) {
    cachedConfig = await getConfig();
  }
  return cachedConfig;
}

function invalidateCache() {
  cachedConfig = null;
}
```

**Step 3: Update onInstalled handler**

Replace the existing `chrome.runtime.onInstalled.addListener` with:

```javascript
// ====== INSTALLATION & MIGRATION ======
chrome.runtime.onInstalled.addListener(async () => {
  // Migrate config if needed (v1.6.0 → v2.0.0)
  await migrateConfig();

  // Load config and build menus
  await rebuildContextMenus();
});
```

**Step 4: Write rebuildContextMenus function**

Add new function to dynamically create menus (insert after onInstalled):

```javascript
// ====== CONTEXT MENU MANAGEMENT ======
async function rebuildContextMenus() {
  // Clear all existing menus
  await chrome.contextMenus.removeAll();

  // Load current config
  const config = await loadConfig();

  // Create root menu
  chrome.contextMenus.create({
    id: 'jobSearchRoot',
    title: 'Send to ChatGPT',
    contexts: ['selection']
  });

  // Create menu item for each enabled action
  const enabledActions = config.actions
    .filter(action => action.enabled)
    .sort((a, b) => a.order - b.order);

  enabledActions.forEach(action => {
    chrome.contextMenus.create({
      id: action.id,
      parentId: 'jobSearchRoot',
      title: action.title,
      contexts: ['selection']
    });
  });

  // Create "Run All" menu item if there are multiple actions
  if (enabledActions.length > 1) {
    chrome.contextMenus.create({
      id: 'runAll',
      parentId: 'jobSearchRoot',
      title: 'Run All Actions',
      contexts: ['selection']
    });
  }

  console.log('[Background] Context menus rebuilt:', enabledActions.length, 'actions');
}
```

**Step 5: Add storage change listener**

Add listener to rebuild menus when config changes:

```javascript
// ====== STORAGE CHANGE LISTENER ======
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === 'sync' && changes.config) {
    console.log('[Background] Config changed, rebuilding...');
    invalidateCache();
    await rebuildContextMenus();

    // Notify all tabs to reload shortcuts
    const tabs = await chrome.tabs.query({});
    const config = await loadConfig();
    const shortcuts = buildShortcutMap(config);

    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'SHORTCUTS_UPDATED',
        shortcuts: Array.from(shortcuts.entries())
      }).catch(() => {
        // Ignore errors for tabs where content script isn't loaded
      });
    });
  }
});
```

**Step 6: Write buildShortcutMap helper**

Add helper function to create shortcut map:

```javascript
// ====== SHORTCUT MAP BUILDER ======
function buildShortcutMap(config) {
  const map = new Map();

  config.actions
    .filter(action => action.enabled && action.shortcut)
    .forEach(action => {
      map.set(action.shortcut, action.id);
    });

  return map;
}
```

**Step 7: Verify background.js loads**

1. Reload extension
2. Open background service worker console:
   - Go to `chrome://extensions/`
   - Click "service worker" link under extension

Expected:
- Console shows "[Config] Migrating..." or "[Config] Already migrated"
- Console shows "[Background] Context menus rebuilt: 3 actions"
- No errors

**Step 8: Commit**

```bash
git add background.js
git commit -m "Refactor background.js for dynamic config (Part 1: Setup)

- Import config module, remove hardcoded values
- Add config caching for performance
- Update onInstalled to call migrateConfig
- Add rebuildContextMenus to dynamically create menus
- Add storage change listener to rebuild on config updates
- Add buildShortcutMap helper for shortcuts content script

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 10: Refactor background.js (Part 2: Update action handlers)

**Files:**
- Modify: `background.js`

**Step 1: Update context menu click handler**

Replace the existing `chrome.contextMenus.onClicked.addListener` with:

```javascript
// ====== CONTEXT MENU CLICK HANDLER ======
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (!info.selectionText) return;

  const config = await loadConfig();
  const actionId = info.menuItemId;

  // Handle "Run All" action
  if (actionId === 'runAll') {
    await runAllActions(info.selectionText.trim(), config);
    return;
  }

  // Find the action
  const action = config.actions.find(a => a.id === actionId);
  if (!action) {
    console.warn('[Background] Action not found:', actionId);
    return;
  }

  // Execute single action
  await executeAction(action, info.selectionText.trim(), config);
});
```

**Step 2: Write executeAction function**

Add new function to execute a single action (insert before runAllActions):

```javascript
// ====== SINGLE ACTION EXECUTION ======
async function executeAction(action, selectionText, config) {
  const prompt = `${action.prompt} ${selectionText}`;

  try {
    const tabId = await openOrFocusGptTab(config, { clear: config.globalSettings.clearContext });

    const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Attempt #1
    const ok1 = await tryInjectWithTiming(tabId, prompt, {
      label: `${action.id}-attempt#1`,
      autoSubmit: config.globalSettings.autoSubmit,
      reqId
    });

    // Retry if needed
    if (!ok1) {
      setTimeout(() => tryInjectWithTiming(tabId, prompt, {
        label: `${action.id}-attempt#2`,
        autoSubmit: config.globalSettings.autoSubmit,
        reqId
      }), 1200);
    }
  } catch (e) {
    console.warn('[Background] Failed to execute action:', action.id, e);
    const t = await chrome.tabs.create({ url: config.globalSettings.customGptUrl, active: true });
    const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setTimeout(() => tryInjectWithTiming(t.id, prompt, {
      label: `${action.id}-fallback`,
      autoSubmit: config.globalSettings.autoSubmit,
      reqId
    }), 1200);
  }
}
```

**Step 3: Update runAllActions function**

Replace the existing `runAllActions` function with:

```javascript
// ====== RUN ALL ACTIONS HANDLER ======
async function runAllActions(selectionText, config) {
  // Get all enabled actions
  const enabledActions = config.actions
    .filter(action => action.enabled)
    .sort((a, b) => a.order - b.order);

  // Launch all actions in parallel, each in its own tab
  const promises = enabledActions.map(async (action) => {
    const prompt = `${action.prompt} ${selectionText}`;

    try {
      // Create a new tab for this action
      const tab = await chrome.tabs.create({
        url: config.globalSettings.customGptUrl,
        active: false
      });
      const tabId = await waitForTitleMatch(tab.id, config.globalSettings.gptTitleMatch, 20000);

      console.log(`[Background] Launching ${action.title} in tab ${tabId}`);

      const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Attempt #1
      const ok1 = await tryInjectWithTiming(tabId, prompt, {
        label: `runAll-${action.id}-attempt#1`,
        autoSubmit: config.globalSettings.autoSubmit,
        reqId
      });

      // Retry if needed
      if (!ok1) {
        setTimeout(() => tryInjectWithTiming(tabId, prompt, {
          label: `runAll-${action.id}-attempt#2`,
          autoSubmit: config.globalSettings.autoSubmit,
          reqId
        }), 1200);
      }
    } catch (e) {
      console.warn(`[Background] Failed to run ${action.title}:`, e);
    }
  });

  await Promise.all(promises);
  console.log('[Background] All actions launched in parallel');
}
```

**Step 4: Update openOrFocusGptTab function**

Replace the existing function signature to accept config:

```javascript
// ====== TAB/TITLE HELPERS ======
async function openOrFocusGptTab(config, { clear = false } = {}) {
  const created = await chrome.tabs.create({
    url: `${config.globalSettings.customGptUrl}?fresh=${Date.now()}`,
    active: true
  });
  return await waitForTitleMatch(created.id, config.globalSettings.gptTitleMatch, 20000);
}
```

**Step 5: Update tryInjectWithTiming to use config**

Update the fallback URL in tryInjectWithTiming (around line 340):

Find this line:
```javascript
url: `${CUSTOM_GPT_URL}?q=${encodeURIComponent("Could not auto-insert text. Please paste below.")}`
```

Replace with:
```javascript
url: `https://chatgpt.com/?q=${encodeURIComponent("Could not auto-insert text. Please paste below.")}`
```

**Step 6: Verify context menu actions work**

1. Reload extension
2. Navigate to any webpage with text
3. Select some text
4. Right-click → "Send to ChatGPT" → should show 3 actions + "Run All"
5. Click "Fit Match" → should open GPT tab and insert text

Expected: Action executes successfully with dynamic config

**Step 7: Commit**

```bash
git add background.js
git commit -m "Refactor background.js for dynamic config (Part 2: Handlers)

- Update context menu click handler to load config dynamically
- Add executeAction function for single action execution
- Update runAllActions to use config instead of hardcoded ACTIONS
- Update openOrFocusGptTab to accept config parameter
- Fix tryInjectWithTiming fallback URL

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 11: Refactor background.js (Part 3: Keyboard shortcuts and messages)

**Files:**
- Modify: `background.js`

**Step 1: Remove old keyboard command handler**

Delete the entire section at the bottom (around lines 382-392):

DELETE:
```javascript
// --- keyboard shortcuts for each sub-action ---
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "fitMatchShortcut") {
    await sendSelectionToGpt("fitMatch");
  } else if (command === "jobSummaryShortcut") {
    await sendSelectionToGpt("jobSummary");
  } else if (command === "criticalFitMatchShortcut") {
    await sendSelectionToGpt("criticalFitMatch");
  } else if (command === "runAllShortcut") {
    await sendSelectionToGpt("runAll");
  }
});
```

**Step 2: Remove old sendSelectionToGpt function**

Delete the entire function (around lines 344-379):

DELETE the entire `async function sendSelectionToGpt(actionId) {...}` function.

**Step 3: Add message listener for shortcuts.js**

Add new message handler for content script communication (insert after storage change listener):

```javascript
// ====== MESSAGE LISTENER FOR SHORTCUTS ======
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SHORTCUTS') {
    // Content script requesting current shortcuts
    loadConfig().then(config => {
      const shortcuts = buildShortcutMap(config);
      sendResponse({ shortcuts: Array.from(shortcuts.entries()) });
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'EXECUTE_SHORTCUT') {
    // Content script triggered a shortcut
    handleShortcutExecution(message.actionId, sender.tab.id);
    return false;
  }
});
```

**Step 4: Write handleShortcutExecution function**

Add function to handle shortcut-triggered actions:

```javascript
// ====== SHORTCUT EXECUTION HANDLER ======
async function handleShortcutExecution(actionId, senderTabId) {
  try {
    const config = await loadConfig();

    // Get selected text from the sender tab
    const [{ result: selection = '' } = {}] = await chrome.scripting.executeScript({
      target: { tabId: senderTabId },
      func: () => (getSelection?.() ? String(getSelection()).trim() : '')
    });

    if (!selection) {
      console.log('[Background] No text selected for shortcut');
      return;
    }

    // Handle "Run All" shortcut
    if (actionId === 'runAll') {
      await runAllActions(selection, config);
      return;
    }

    // Find the action
    const action = config.actions.find(a => a.id === actionId);
    if (!action) {
      console.warn('[Background] Action not found for shortcut:', actionId);
      return;
    }

    // Execute the action
    await executeAction(action, selection, config);
  } catch (e) {
    console.error('[Background] Failed to handle shortcut execution:', e);
  }
}
```

**Step 5: Verify keyboard shortcuts work**

1. Reload extension
2. Open any webpage with text
3. Select some text
4. Press Alt+Shift+J (or configured shortcut)

Expected:
- GPT tab opens
- Text is injected with "Create a Fit Match..." prompt
- Check console logs in background service worker

**Step 6: Test options page → background updates**

1. Open options page
2. Change a shortcut (e.g., Fit Match to Alt+Shift+M)
3. Click Save
4. Go to any page, select text
5. Press Alt+Shift+M

Expected: Action triggers with new shortcut, old shortcut no longer works

**Step 7: Commit**

```bash
git add background.js
git commit -m "Refactor background.js for dynamic config (Part 3: Shortcuts)

- Remove old Chrome commands API handler
- Remove old sendSelectionToGpt function
- Add message listener for shortcuts.js communication
- Add handleShortcutExecution to process shortcut triggers
- Support GET_SHORTCUTS and EXECUTE_SHORTCUT messages

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 12: Manual testing and verification

**Files:**
- None (testing only)

**Step 1: Fresh install testing**

Simulate fresh install:
1. Go to `chrome://extensions/`
2. Remove the extension
3. Click "Load unpacked"
4. Select `.worktrees/feature/custom-configuration`

Verify:
- Extension loads without errors
- Service worker console shows migration complete
- Open options page → default values present
- Context menu shows 3 actions

**Step 2: Configuration persistence testing**

Test save/load cycle:
1. Open options page
2. Change GPT URL to dummy value: "https://chatgpt.com/g/test"
3. Change "Fit Match" title to "Test Action"
4. Click Save → success message
5. Close options page
6. Reopen options page

Verify:
- Changes persisted
- All fields show updated values

**Step 3: Action management testing**

Test add/remove/reorder:
1. Open options page
2. Click "+ Add Action"
3. Fill in: Title "Test Action", Prompt "Test:", Shortcut Alt+Shift+T
4. Click Save
5. Right-click selected text on any page

Verify:
- Context menu shows 4 actions including "Test Action"

6. Return to options page
7. Delete "Test Action"
8. Move "Job Summary" above "Fit Match" (drag or arrows)
9. Click Save
10. Check context menu again

Verify:
- Only 3 actions remain
- "Job Summary" appears first

**Step 4: Keyboard shortcut testing**

Test shortcut capture and execution:
1. Open options page
2. Click keyboard icon for "Fit Match"
3. Press Ctrl+Shift+F
4. Click Save
5. Go to any webpage
6. Select text
7. Press Ctrl+Shift+F

Verify:
- GPT tab opens
- Text injected with Fit Match prompt

**Step 5: Import/Export testing**

Test JSON import/export:
1. Open options page
2. Click "Export JSON"
3. Save file
4. Make changes to config (add action, change settings)
5. Click Save
6. Click "Import JSON"
7. Select previously exported file
8. Confirm import

Verify:
- Config reverts to exported state
- All changes undone

**Step 6: Run All testing**

Test parallel execution:
1. Navigate to webpage with job description
2. Select job description text
3. Right-click → "Send to ChatGPT" → "Run All Actions"

Verify:
- 3 new tabs open (one per enabled action)
- Each tab gets different prompt (Job Summary, Fit Match, Critical Fit)
- All tabs process in background

**Step 7: Validation testing**

Test error handling:
1. Open options page
2. Clear GPT URL field
3. Click Save

Verify:
- Error banner shows validation error
- Config not saved

4. Restore valid URL
5. Set same shortcut for two actions
6. Click Save

Verify:
- Error shows duplicate shortcut message

7. Try to delete all actions

Verify:
- Error prevents deleting last action

**Step 8: Document test results**

Create test report:

```
Manual Testing Report - v2.0.0

✅ Fresh install and migration
✅ Configuration persistence
✅ Add/remove/reorder actions
✅ Keyboard shortcut capture and execution
✅ Import/Export JSON
✅ Run All parallel execution
✅ Validation and error handling
✅ Context menu dynamic updates
✅ Storage change propagation to content scripts

Known Issues:
- None

Tested on:
- Chrome Version: [YOUR VERSION]
- OS: [YOUR OS]
- Date: 2025-10-22
```

**Step 9: Commit any bug fixes**

If bugs found during testing:
```bash
git add [fixed-files]
git commit -m "Fix: [description of bug fix]"
```

**Step 10: Mark testing complete**

No commit needed - testing complete.

---

## Task 13: Update README.md

**Files:**
- Modify: `README.md`

**Step 1: Update version and features section**

Update the top section of README.md:

Find lines 1-15 and update:

```markdown
# ChatGPT Actions - Chrome Extension

A Chrome extension that allows you to send selected text to your custom ChatGPT assistant with configurable actions, shortcuts, and settings.

## Features

- **Fully Configurable**: Configure all actions, shortcuts, and settings via options page
- **Custom Actions**: Add, edit, remove, and reorder actions without code changes
- **Custom Shortcuts**: Assign any keyboard shortcut to any action
- **Import/Export**: Backup and share configurations via JSON
- **Context Menu Integration**: Right-click selected text to send it to your custom GPT
- **Smart Tab Management**: Automatically opens or focuses your GPT tab
- **Auto-Submit**: Optionally submit prompts automatically for hands-free operation
- **Parallel Processing**: Run all actions simultaneously in separate tabs
- **Robust Injection**: Automatic retry on failure with fresh context option
```

**Step 2: Update Actions section**

Replace the "Actions" section (around lines 16-29) with:

```markdown
## Default Actions

The extension comes with three pre-configured actions (fully customizable via options page):

### 1. Fit Match (Alt+Shift+J) — *Mac: Option+Shift+J*
Analyzes how well your background fits a job description.

### 2. Job Summary (Alt+Shift+K) — *Mac: Option+Shift+K*
Creates a concise summary of a job posting.

### 3. Critical Fit Match (Alt+Shift+L) — *Mac: Option+Shift+L*
Provides a critical, thorough analysis of job fit.

### 4. Run All Actions (customizable shortcut)
Runs all enabled actions simultaneously in separate browser tabs for parallel processing.

**Note:** All actions, their prompts, and shortcuts are fully configurable via the extension's options page.
```

**Step 3: Update Configuration section**

Replace the "Configuration" section (around lines 42-54) with:

```markdown
### Configuration

**v2.0.0 and later:** All configuration is done through the options page (chrome://extensions → Details → Extension options).

**Configuration Options:**
- **Custom GPT URL**: Your custom GPT URL (e.g., https://chatgpt.com/g/g-...)
- **GPT Title Match**: Browser tab title to match (for finding existing tabs)
- **Clear Context**: Set to enable/disable starting fresh conversation each time
- **Auto Submit**: Set to enable/disable automatically submitting prompts
- **Actions**: Add, edit, remove, and reorder actions with custom prompts and shortcuts

**For v1.6.0 and earlier users:** Your existing configuration will be automatically migrated to the new options page on first load.
```

**Step 4: Update Usage section**

Update "Customizing Shortcuts" subsection (around line 99):

```markdown
### Customizing Shortcuts

**v2.0.0 and later:**
1. Go to Extension options (chrome://extensions → Details → Extension options)
2. Click the keyboard icon (⌨️) next to any action
3. Press your desired key combination
4. Click "Save"

**v1.6.0 and earlier:**
1. Go to `chrome://extensions/shortcuts`
2. Find "ChatGPT Actions"
3. Click the edit icon to set your preferred shortcuts
```

**Step 5: Add new "Import/Export Configuration" section**

Add after the Usage section (around line 103):

```markdown
## Import/Export Configuration

### Exporting Your Configuration

1. Open Extension options
2. Click "Export JSON"
3. Save the downloaded `chatgpt-actions-config.json` file

Use this to:
- Backup your configuration
- Share configurations with others
- Sync settings across multiple computers

### Importing a Configuration

1. Open Extension options
2. Click "Import JSON"
3. Select a previously exported configuration file
4. Confirm the import

**Warning:** Importing will replace your current configuration. Export your current settings first if you want to preserve them.
```

**Step 6: Update Limitations section**

Update limitations (around line 213):

```markdown
## Limitations

- Only works with ChatGPT (chatgpt.com and chat.openai.com)
- Requires ChatGPT Plus subscription for custom GPT access
- ~~Hardcoded GPT URL~~ **Now configurable via options page!**
- No icon or visual branding
- Fixed retry timing may not work on very slow connections
```

**Step 7: Update Future Enhancements section**

Update/remove items (around line 222):

```markdown
## Future Enhancements

Potential improvements for future versions:
- ~~Options page for configuration~~ **✅ Completed in v2.0.0**
- ~~Support for multiple custom actions~~ **✅ Completed in v2.0.0**
- ~~Configurable keyboard shortcuts~~ **✅ Completed in v2.0.0**
- Extension icon and branding
- Configurable retry timing
- Status notifications instead of alerts
- Support for Claude/other AI assistants
- Action templates marketplace
```

**Step 8: Update Version History**

Add v2.0.0 at the top of version history (around line 233):

```markdown
## Version History

### 2.0.0 (Current) - **Major Update: Fully Configurable**
- **Options Page**: Full configuration UI for all settings
- **Custom Actions**: Add, edit, remove, and reorder actions
- **Custom Shortcuts**: Assign any keyboard shortcut to any action
- **Import/Export**: Backup and share configurations via JSON
- **Dynamic Menus**: Context menus rebuild automatically from config
- **Migration**: Automatic migration from v1.6.0 hardcoded config
- **Breaking Change**: Config now stored in chrome.storage.sync (not code)

### 1.6.0
- **Run All Actions**: Execute all three actions in parallel tabs
- Keyboard shortcut (Alt+Shift+H) for Run All
- Context menu option for Run All
- Parallel tab management for simultaneous processing
```

**Step 9: Add Upgrading section**

Add new section after Version History:

```markdown
## Upgrading from v1.6.0 to v2.0.0

### Automatic Migration

When you first load v2.0.0, your existing hardcoded configuration will be automatically migrated to the new options page. No action required!

**What's Migrated:**
- All three default actions (Fit Match, Job Summary, Critical Fit Match)
- Default keyboard shortcuts (Alt+Shift+J, K, L)
- GPT URL and title match
- Auto-submit and clear context settings

### Important Notes

- **Downgrading:** You cannot downgrade from v2.0.0 to v1.6.0 without losing your configuration. Export your config first if you need to downgrade.
- **Customizations:** If you modified `background.js` directly in v1.6.0, those customizations will be lost. Use the options page in v2.0.0 instead.
- **Backup:** Consider exporting your configuration after migration to keep a backup.
```

**Step 10: Verify README accuracy**

1. Read through entire updated README
2. Check all links and instructions
3. Verify version numbers match

**Step 11: Commit**

```bash
git add README.md
git commit -m "Update README for v2.0.0 configurable actions

- Update features list with configuration capabilities
- Add Import/Export documentation
- Update configuration section for options page
- Add upgrading guide from v1.6.0
- Update version history with v2.0.0 details
- Mark completed items in future enhancements

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 14: Final verification and branch merge preparation

**Files:**
- None (verification only)

**Step 1: Final functionality check**

Run complete test suite:
1. ✅ Fresh extension load (no errors)
2. ✅ Default config migration works
3. ✅ Options page loads and displays config
4. ✅ Save button persists changes
5. ✅ Add/delete/reorder actions works
6. ✅ Keyboard shortcut capture works
7. ✅ Shortcut execution triggers actions
8. ✅ Context menu execution works
9. ✅ Run All launches parallel tabs
10. ✅ Import/Export JSON works
11. ✅ Validation prevents invalid configs
12. ✅ Storage changes propagate to all tabs

**Step 2: Check all commits**

View commit history:
```bash
cd .worktrees/feature/custom-configuration
git log --oneline main..HEAD
```

Verify:
- All 14 tasks committed
- Commit messages follow format
- No uncommitted changes

**Step 3: Final code review**

Check for:
- No console.log statements meant for debugging only (keep the useful ones)
- No commented-out code
- No TODO comments
- All files have proper structure

**Step 4: Verify no regressions**

Test that original v1.6.0 functionality still works:
1. Select text on any page
2. Right-click → context menu works
3. Actions execute and inject text
4. GPT tab opens/focuses correctly
5. Auto-submit still works
6. Clear context still works
7. Run All still works

**Step 5: Create summary of changes**

Document what was built:

```
v2.0.0 Implementation Summary

Files Created:
- config.js (230 lines) - Configuration management module
- options.html (150 lines) - Options page structure
- options.css (380 lines) - Options page styling
- options.js (450 lines) - Options page logic
- shortcuts.js (60 lines) - Keyboard shortcut content script
- docs/plans/2025-10-22-configurable-actions-design.md
- docs/plans/2025-10-22-configurable-actions.md

Files Modified:
- manifest.json - Added permissions, content scripts, options page
- background.js - Complete refactor for dynamic config
- README.md - Updated for v2.0.0 features

Total Lines Added: ~1,500
Total Lines Modified: ~500

Key Features:
✅ Options page with full configuration UI
✅ Add/edit/remove/reorder actions dynamically
✅ Custom keyboard shortcuts with capture widget
✅ Import/Export JSON configuration
✅ Automatic migration from v1.6.0
✅ Validation with helpful error messages
✅ Reactive updates across all components
```

**Step 6: Prepare for merge**

The implementation is complete and tested. Branch is ready for:
1. Final review
2. Merge to main
3. Release as v2.0.0

---

## Plan Complete

This implementation plan provides bite-sized, executable tasks to transform the ChatGPT Actions extension from a hardcoded system to a fully configurable platform. Each task includes:

- ✅ Exact file paths
- ✅ Complete code snippets
- ✅ Verification steps
- ✅ Commit messages
- ✅ Expected outcomes

The plan follows TDD principles where applicable, uses DRY and YAGNI, includes frequent commits, and assumes zero codebase context.

**Total Estimated Time:** 8-12 hours
**Recommended Approach:** Execute tasks sequentially in a single focused session
