# Configurable Actions Extension - Design Document

**Date:** 2025-10-22
**Version:** 2.0.0
**Status:** Implemented ✅
**Merge Date:** 2025-10-23
**Tag:** v2.0.0_custom_configuration

## Overview

Transform the ChatGPT Actions Chrome extension from a hardcoded system into a fully configurable platform where users can define, customize, and manage their own actions, keyboard shortcuts, and global settings through a user-friendly options page.

## Goals

1. **User Configurability**: Enable users to add, edit, remove, and reorder actions without code changes
2. **Flexible Shortcuts**: Custom keyboard shortcut system supporting unlimited actions
3. **Settings Management**: Make all global settings (GPT URL, auto-submit, clear context) configurable
4. **Import/Export**: Allow users to backup, share, and restore configurations via JSON
5. **Seamless Migration**: Auto-migrate existing v1.6.0 users to new system with current defaults

## Architecture

### Approach: Storage-Driven Dynamic System

We selected this approach for its clean separation of concerns and reactive update model:

- **chrome.storage.sync** serves as the single source of truth
- Configuration changes trigger automatic rebuilds of context menus and keyboard shortcuts
- Custom keyboard listener in content script (not Chrome's commands API) enables unlimited shortcuts
- Moderate complexity with clear benefits for extensibility

**Alternatives Considered:**
- Modular Action Plugin System: Too complex for initial implementation
- Minimal Config Layer: Insufficient flexibility for dynamic add/remove requirements

## Data Model

### Storage Schema

```javascript
{
  globalSettings: {
    customGptUrl: string,      // e.g., "https://chatgpt.com/g/g-..."
    gptTitleMatch: string,     // e.g., "ChatGPT - Keith Fry's Job Match..." (hidden from UI)
    contextMenuTitle: string,  // Right-click menu title (configurable)
    clearContext: boolean,     // Start fresh conversation each time (hidden from UI)
    autoSubmit: boolean,       // Automatically submit prompts
    runAllEnabled: boolean,    // Show/hide "Run All Actions" feature
    runAllShortcut: string     // Keyboard shortcut for Run All (e.g., "Alt+Shift+H")
  },
  actions: [
    {
      id: string,              // Unique identifier (e.g., "fitMatch")
      title: string,           // Display name in context menu
      prompt: string,          // Message prefix to send to GPT
      shortcut: string,        // e.g., "Alt+Shift+J"
      enabled: boolean,        // Can be toggled on/off
      order: number            // Sorting order in menus
    }
  ]
}
```

### Default Configuration

Current defaults (stored in `default-config.js`):

```javascript
const DEFAULT_CONFIG = {
  globalSettings: {
    customGptUrl: "https://chatgpt.com/g/g-68b0b1831c0c819186bcf8bc0ecef4fa-keith-fry-s-job-match-and-cover-letter-coach",
    gptTitleMatch: "ChatGPT - Keith Fry's Job Match and Cover Letter Coach",
    contextMenuTitle: "Send to ChatGPT",
    clearContext: true,
    autoSubmit: true,
    runAllEnabled: true,
    runAllShortcut: "Alt+Shift+H"
  },
  actions: [
    {
      id: "jobSummary",
      title: "Job Summary",
      prompt: "Create a Job Summary in 5 sentences for following position:",
      shortcut: "Alt+Shift+J",
      enabled: true,
      order: 1
    },
    {
      id: "fitMatch",
      title: "Fit Match",
      prompt: "Create a Fit Match, do not create a cover letter:",
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

**Note:** `clearContext` and `gptTitleMatch` are hidden from the options UI but preserved in the configuration for future use.

## Component Architecture

### File Structure

```
job-search-extension-chatgpt/
├── manifest.json           # Updated with new permissions
├── background.js           # Refactored for dynamic system
├── config.js              # Configuration manager (validation, storage)
├── default-config.js      # Default configuration (user-editable)
├── shortcuts.js           # Custom keyboard handler (content script)
├── options.html           # Configuration UI
├── options.js             # Options page logic
├── options.css            # Options page styles
└── docs/
    └── plans/
        └── 2025-10-22-configurable-actions-design.md
```

### Module Responsibilities

#### default-config.js - Default Configuration
- `DEFAULT_CONFIG`: User-editable defaults separated from validation logic
- Easy to customize without touching validation or storage code

#### config.js - Configuration Manager
- Imports `DEFAULT_CONFIG` from default-config.js
- `getConfig()`: Loads from chrome.storage.sync with fallback to defaults
- `saveConfig(config)`: Validates and writes to storage
- `validateConfig(config)`: Schema validation with detailed error messages
- `migrateConfig()`: One-time migration for v1.6.0 → v2.0.0 users

#### shortcuts.js - Custom Keyboard Handler (Content Script)
- Injected into all pages via manifest
- Listens for keydown events globally
- Maintains Map of shortcut strings → action IDs
- Normalizes keyboard events using `e.code` for Mac compatibility
- Validates extension context before sending messages
- Captures selected text and passes it to background.js (avoids host permission issues)
- Sends messages to background.js when shortcut triggered
- Updates shortcut map when config changes

#### options.html/js - Configuration UI
- Form-based editor for global settings (some fields hidden from UI)
- Configurable context menu title
- Enable/disable Run All feature with custom shortcut
- Dynamic action list with add/remove/reorder controls
- Keyboard shortcut capture widget with Mac compatibility (`e.code`)
- Validation and error display
- JSON export/import functionality
- Drag-and-drop reordering support
- Hidden fields (`clearContext`, `gptTitleMatch`) preserved during save

#### background.js - Main Service Worker (Refactored)
- Initialize default config on first install (calls migrateConfig)
- Listen to chrome.storage.onChanged and rebuild menus/shortcuts
- Dynamically builds context menus from config (including optional Run All)
- Handle context menu clicks with dynamic action lookup
- Handle keyboard shortcut messages from shortcuts.js (receives selection text)
- Run All: Creates tabs sequentially for order, injects prompts in parallel for speed
- Core injection logic (mostly unchanged from v1.6.0)

## Data Flows

### 1. Initial Setup Flow (First Install)
```
User installs extension
  → chrome.runtime.onInstalled fires
  → Check if config exists in storage
  → If not, call migrateConfig()
  → Write DEFAULT_CONFIG to storage
  → Build context menus from config
  → shortcuts.js loads shortcut map
```

### 2. Configuration Change Flow
```
User opens options page
  → Load current config from chrome.storage.sync
  → User edits actions/shortcuts/settings
  → User clicks Save
  → Validation runs client-side
  → If valid, write to chrome.storage.sync
  → chrome.storage.onChanged fires in background.js
  → background.js clears all context menus
  → Rebuild menus from new config
  → Send message to all tabs to update shortcuts
  → shortcuts.js receives message and reloads shortcut map
```

### 3. Action Execution Flow
```
User selects text and triggers via context menu OR keyboard
  → background.js receives event with action ID
  → Load current config to get action details
  → Build prompt: action.prompt + selected text
  → Execute injection logic:
    - openOrFocusGptTab (or create new tabs for Run All)
    - tryInjectWithTiming with retry logic
```

### 4. JSON Import/Export Flow
```
Export:
  User clicks Export Config
    → Load current config from storage
    → Create JSON blob
    → Download as chatgpt-actions-config.json

Import:
  User clicks Import Config
    → File picker opens
    → Read and parse JSON
    → Validate config
    → Show preview modal with changes
    → User confirms
    → Write to storage
    → Trigger rebuild flow
```

## Custom Keyboard Shortcut System

### Design Decision
We're implementing a custom shortcut system instead of using Chrome's commands API because:
- Chrome's API limits extensions to 4 shortcuts
- We need unlimited, dynamic shortcuts
- Users should be able to add/remove actions without manifest changes

### Shortcut Format
- Stored as strings: `"Alt+Shift+J"`, `"Ctrl+K"`, `"Meta+Shift+L"`
- Supported modifiers: Ctrl, Alt, Shift, Meta (Cmd on Mac)
- Single key required after modifiers
- Case-insensitive for letter keys

### Implementation

**shortcuts.js (Content Script):**
```javascript
// Maintains shortcut map
let shortcutMap = new Map(); // "Alt+Shift+J" → "fitMatch"

// On page load, request current shortcuts
chrome.runtime.sendMessage({ type: 'GET_SHORTCUTS' }, (response) => {
  shortcutMap = new Map(response.shortcuts);
});

// Listen for config updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SHORTCUTS_UPDATED') {
    shortcutMap = new Map(message.shortcuts);
  }
});

// Global keydown listener
document.addEventListener('keydown', (event) => {
  const shortcut = normalizeShortcut(event);
  const actionId = shortcutMap.get(shortcut);

  if (actionId) {
    event.preventDefault();
    chrome.runtime.sendMessage({
      type: 'EXECUTE_ACTION',
      actionId: actionId
    });
  }
});

function normalizeShortcut(event) {
  const parts = [];
  if (event.ctrlKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');
  if (event.metaKey) parts.push('Meta');

  // Use e.code for Mac compatibility (physical key, not transformed character)
  const code = event.code;
  let displayKey;
  if (code.startsWith('Key')) {
    displayKey = code.replace('Key', ''); // "KeyY" -> "Y"
  } else if (code.startsWith('Digit')) {
    displayKey = code.replace('Digit', ''); // "Digit1" -> "1"
  } else if (code.startsWith('Arrow')) {
    displayKey = code.replace('Arrow', ''); // "ArrowUp" -> "Up"
  } else {
    displayKey = code; // Use as-is for special keys
  }
  parts.push(displayKey);

  return parts.join('+');
}
```

**Options Page Shortcut Capture:**
- Each action has a "Record Shortcut" button (keyboard icon)
- Click activates capture mode
- Listens for next keydown event
- Displays captured combination
- Validates: must include modifier, checks for conflicts
- Shows warning if shortcut already used by another action

### Conflict Handling
- Options page prevents saving duplicate shortcuts among enabled actions
- If duplicate detected: "This shortcut is already used by [Action Name]"
- Future enhancement: Option to swap shortcuts between actions

## User Interface

### Options Page Layout

```
┌─────────────────────────────────────────┐
│  ChatGPT Actions - Configuration │
├─────────────────────────────────────────┤
│                                         │
│  Global Settings                        │
│  ┌───────────────────────────────────┐ │
│  │ Custom GPT URL: [____________]    │ │
│  │ Context Menu Title: [__________]  │ │
│  │ ☑ Auto Submit                    │ │
│  │ ☑ Enable "Run All Actions"       │ │
│  │ Run All Shortcut: [Alt+Shift+H][⌨️]│ │
│  └───────────────────────────────────┘ │
│                                         │
│  Actions                    [+ Add Action] │
│  ┌───────────────────────────────────┐ │
│  │ [≡] Job Summary         [↑][↓][×]│ │
│  │     Prompt: [_____________________]│ │
│  │     Shortcut: [Alt+Shift+J] [⌨️]  │ │
│  │     ☑ Enabled                     │ │
│  ├───────────────────────────────────┤ │
│  │ [≡] Fit Match           [↑][↓][×]│ │
│  │     Prompt: [_____________________]│ │
│  │     Shortcut: [Alt+Shift+K] [⌨️]  │ │
│  │     ☑ Enabled                     │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Export JSON] [Import JSON]            │
│  [Save]                [Cancel]         │
└─────────────────────────────────────────┘
```

**Hidden Fields (preserved in configuration):**
- `clearContext`: Always true (hidden from UI)
- `gptTitleMatch`: Browser tab title matching (hidden from UI)

### UI Features
- **Drag handles** [≡] for reordering (updates order field)
- **Up/down arrows** as alternative to dragging
- **Delete button** [×] with confirmation dialog
- **Keyboard icon** [⌨️] to record shortcut
- **Enable/disable checkbox** per action
- **Add Action** creates new entry with auto-generated unique ID
- **Form validation** before save (red outline for invalid fields)
- **Success/error toast** notifications

### Styling
- Clean, minimal CSS (no framework dependencies)
- Light theme matching Chrome's extension style guidelines
- Responsive for different window sizes (min-width: 600px)

## Validation & Error Handling

### Config Validation Rules

```javascript
function validateConfig(config) {
  const errors = [];

  // Global settings validation
  if (!config.globalSettings.customGptUrl?.startsWith('https://chatgpt.com/')) {
    errors.push('Custom GPT URL must start with https://chatgpt.com/');
  }

  if (!config.globalSettings.gptTitleMatch?.trim()) {
    errors.push('GPT Title Match is required');
  }

  // Actions validation
  if (!Array.isArray(config.actions) || config.actions.length === 0) {
    errors.push('At least one action is required');
  }

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
      errors.push(`Action ${index + 1}: Enabled must be true/false`);
    }
    if (typeof action.order !== 'number') {
      errors.push(`Action ${index + 1}: Order must be a number`);
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

  return errors;
}
```

### Error Display
- **Options page**: Red banner at top with all validation errors
- **Individual fields**: Red border highlighting invalid fields
- **Save button**: Disabled until all errors resolved
- **Import modal**: Shows validation errors before confirming changes

### Edge Cases

1. **Storage quota exceeded** (chrome.storage.sync has ~100KB limit)
   - Show error: "Configuration too large. Try reducing number of actions or shortening prompts."
   - Don't save corrupted data

2. **Network/sync issues**
   - Fall back to last known good config cached in memory
   - Show warning: "Unable to save to cloud. Changes are local only."

3. **Corrupt storage data**
   - Detect via try/catch on JSON parse
   - Clear corrupt data
   - Reload DEFAULT_CONFIG
   - Notify user: "Configuration was corrupted and has been reset to defaults."

4. **User deletes all actions**
   - Validation prevents this (minimum 1 required)
   - Error: "At least one action is required"

5. **Keyboard shortcut conflicts with browser/OS**
   - Document known conflicts in README (Ctrl+W, Cmd+Q, etc.)
   - Recommend using Alt+Shift or Ctrl+Shift combinations

6. **ChatGPT DOM changes**
   - Existing retry logic in tryInjectWithTiming handles this
   - No changes needed

7. **Rapid config changes**
   - Debounce rebuild operations (300ms) to avoid thrashing
   - Queue updates, process latest

## Migration Strategy

### Auto-Migration from v1.6.0

```javascript
// In background.js - runs on chrome.runtime.onInstalled
async function migrateConfig() {
  const { config } = await chrome.storage.sync.get('config');

  // Already has new config format
  if (config) {
    console.log('[Config] Already migrated');
    return;
  }

  // First time running v2.0.0 - create default config
  console.log('[Config] Migrating to v2.0.0...');

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

  await chrome.storage.sync.set({ config: DEFAULT_CONFIG });
  console.log('[Config] Migration complete');
}
```

### User Experience
- **Seamless**: No user action required on upgrade
- **Preserves behavior**: Defaults match v1.6.0 hardcoded values exactly
- **Discoverable**: README update section explains new options page

### Backward Compatibility
- v2.0.0 **cannot** downgrade to v1.6.0 without losing configuration
- Document this in README upgrade notes
- Consider adding "Export config before upgrading" recommendation (future enhancement)

## Manifest Changes

### Updated manifest.json

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

### Key Changes from v1.6.0
- **Added**: `"storage"` permission for chrome.storage.sync
- **Added**: `content_scripts` entry for shortcuts.js on all URLs
- **Added**: `options_page` for configuration UI
- **Added**: `"type": "module"` to enable ES6 imports in background.js
- **Removed**: `commands` section (no longer using Chrome's commands API)

## Testing Strategy

### Manual Testing Checklist

**Installation & Migration:**
- [ ] Fresh install - verify default config loads
- [ ] Upgrade from v1.6.0 - verify migration creates default config
- [ ] Open options page - verify default values displayed correctly

**Action Management:**
- [ ] Add new action - verify appears in context menu
- [ ] Remove action - verify disappears from menu and shortcut stops working
- [ ] Reorder actions - verify menu order updates
- [ ] Disable action - verify grayed out in menu, shortcut disabled
- [ ] Enable disabled action - verify works again

**Keyboard Shortcuts:**
- [ ] Change shortcut - verify old stops working, new starts working
- [ ] Try duplicate shortcut - verify validation prevents save
- [ ] Record shortcut with keyboard capture - verify displays correctly
- [ ] Test modifier combinations (Ctrl, Alt, Shift, Meta)
- [ ] Verify shortcuts work across different tab contexts

**Global Settings:**
- [ ] Change GPT URL - verify new URL used for tab opening
- [ ] Toggle auto-submit - verify behavior changes
- [ ] Toggle clear context - verify context handling changes

**Import/Export:**
- [ ] Export config - verify JSON file downloads correctly
- [ ] Import valid config - verify applies correctly
- [ ] Import invalid config - verify shows errors, doesn't corrupt
- [ ] Import with duplicate IDs - verify validation catches it

**Multi-Tab Scenarios:**
- [ ] Open options in multiple tabs - verify changes sync
- [ ] Change config - verify all content tabs update shortcuts
- [ ] Run All Actions - verify uses only enabled actions
- [ ] Execute action in different tabs - verify consistent behavior

**Edge Cases:**
- [ ] Try to delete all actions - verify blocked by validation
- [ ] Enter extremely long prompt - verify within storage limits
- [ ] Rapid config changes - verify no race conditions
- [ ] Invalid JSON import - verify graceful error handling

### Automated Testing (Future Enhancement)
- Unit tests for config.js validation logic
- Integration tests for storage read/write
- End-to-end tests for critical user flows

## Documentation Updates

### README Sections to Update

1. **Version History** - Add v2.0.0 with breaking changes note
2. **Installation** - Update configuration section to reference options page
3. **Configuration** - Complete rewrite explaining options UI
4. **Features** - Add configurable actions, import/export
5. **Usage** - Update to mention customizable shortcuts
6. **Troubleshooting** - Add config-related troubleshooting
7. **Upgrading** - New section for v1.6.0 → v2.0.0 migration notes

### New Documentation Files
- `docs/CONFIGURATION.md` - Detailed guide for options page
- `docs/SHORTCUTS.md` - Keyboard shortcut system documentation
- `docs/CONFIG-SCHEMA.md` - JSON configuration format reference

## Future Enhancements

These features are out of scope for v2.0.0 but documented for future consideration:

1. **Action Templates** - Pre-built action library users can install
2. **Shortcut Swapping** - Quick swap shortcuts between actions
3. **Cloud Sync Indicator** - Visual indicator of sync status
4. **Multiple GPT Profiles** - Switch between different custom GPTs
5. **Action Variables** - Template variables in prompts (e.g., `{selection}`, `{date}`)
6. **Keyboard Shortcut Help** - On-page overlay showing available shortcuts
7. **Undo/Redo** - Config change history with rollback
8. **Action Statistics** - Track usage frequency per action
9. **Dark Mode** - Options page theme preference
10. **Localization** - Multi-language support

## Success Criteria

v2.0.0 implementation completed successfully:

1. ✅ Users can add/edit/remove actions without touching code
2. ✅ Keyboard shortcuts are fully customizable with Mac compatibility
3. ✅ Global settings accessible via UI (some hidden for future use)
4. ✅ Config can be exported/imported via JSON
5. ✅ v1.6.0 users migrate seamlessly with no loss of functionality
6. ✅ No regressions in core injection and execution logic
7. ✅ Options page is intuitive and requires no documentation to use
8. ✅ All edge cases handled gracefully with clear error messages
9. ✅ Context menu title is configurable
10. ✅ Run All feature can be enabled/disabled with custom shortcut
11. ✅ Tabs created in correct order with parallel processing for speed

## Implementation Timeline

Estimated effort: 8-12 hours over 2-3 days

**Phase 1: Foundation (2-3 hours)**
- Create feature branch
- Build config.js module with validation
- Update manifest.json

**Phase 2: Options UI (3-4 hours)**
- Create options.html structure
- Build options.js logic (form handling, validation)
- Style options.css
- Implement drag-drop reordering

**Phase 3: Shortcuts System (2-3 hours)**
- Build shortcuts.js content script
- Implement keyboard capture in options page
- Test cross-tab communication

**Phase 4: Background Refactor (2-3 hours)**
- Refactor background.js for dynamic system
- Implement storage listeners
- Test context menu rebuilding

**Phase 5: Testing & Documentation (2-3 hours)**
- Manual testing against checklist
- Fix bugs
- Update README and create new docs
- Final review and merge

## Implementation Notes

### Issues Discovered and Resolved

1. **Duplicate Context Menu IDs**
   - **Issue**: Chrome caching context menus causing "duplicate id" errors
   - **Solution**: Added try-catch error handling in `rebuildContextMenus()`, advised users to completely remove/reload extension

2. **Mac Keyboard Compatibility**
   - **Issue**: Using `e.key` returned transformed characters on Mac (e.g., "Á" instead of "Y" for Option+Shift+Y)
   - **Solution**: Switched to `e.code` for physical key detection in both `options.js` and `shortcuts.js`
   - **Files**: `options.js:218-256`, `shortcuts.js:14-33`

3. **Extension Context Invalidation**
   - **Issue**: After extension reload, content scripts tried to communicate with non-existent background script
   - **Solution**: Added `chrome.runtime?.id` check before sending messages, friendly error logging
   - **Files**: `shortcuts.js:70-72`

4. **Host Permission Errors**
   - **Issue**: Background script tried to access page content without host permissions
   - **Solution**: Content script now captures selected text and passes it in message, avoiding permission issues
   - **Files**: `shortcuts.js:76-80`, `background.js:477-498`

5. **Run All Execution Order**
   - **Issue**: Initially only executed first 3 actions, tabs opened slowly one at a time
   - **Solution**: Changed to create all tabs immediately in order, then inject prompts in parallel
   - **Files**: `background.js:183-237`

### Additional Features Implemented

- **Configurable Context Menu Title**: Users can customize the right-click menu text
- **Optional Run All Feature**: Can be enabled/disabled with custom keyboard shortcut
- **Separated Default Config**: `default-config.js` for easy customization without touching validation logic
- **Hidden UI Fields**: `clearContext` and `gptTitleMatch` preserved in config but hidden from UI for future use

### File Structure Changes

**New Files:**
- `default-config.js` - Default configuration (user-editable)
- `config.js` - Configuration manager with validation
- `shortcuts.js` - Content script for keyboard shortcuts
- `options.html`, `options.js`, `options.css` - Configuration UI

**Modified Files:**
- `manifest.json` - Added storage permission, content_scripts, options_page, ES6 modules
- `background.js` - Refactored for dynamic configuration system
- `README.md` - Updated for v2.0.0 features

---

**Design Approved By:** User
**Implementation Branch:** `feature/custom-configuration`
**Merged To:** main
**Merge Date:** 2025-10-23
**Git Tag:** v2.0.0_custom_configuration
