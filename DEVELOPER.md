# Developer Documentation

This document contains technical details, architecture information, and development instructions for the ChatGPT Custom Prompts Chrome extension.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Component Details](#component-details)
- [Configuration System](#configuration-system)
- [How It Works](#how-it-works)
- [Development Workflow](#development-workflow)
- [Build & Distribution](#build--distribution)
- [Common Modifications](#common-modifications)
- [Debugging](#debugging)

## Architecture Overview

### Technology Stack
- **Manifest Version**: 3 (latest Chrome extension standard)
- **Service Worker**: background.js handles all extension logic (no persistent background page)
- **Content Script**: shortcuts.js injected into all pages for keyboard shortcut handling
- **Dynamic Script Injection**: Content scripts injected into ChatGPT pages on-demand
- **Storage**: chrome.storage.sync for cross-device configuration synchronization
- **Pure JavaScript**: No build tools, bundlers, or dependencies required

### Key Design Principles
- **Minimal Permissions**: Only requests essential permissions for security
- **Configuration-First**: All behavior driven by user configuration stored in chrome.storage
- **Version Management**: Configuration schema versioning with automatic migration
- **Fail-Safe Defaults**: Ships with empty config, preventing accidental exposure of default actions
- **Retry Logic**: Robust error handling with automatic retry on injection failures

## Project Structure

```
chatgpt-query-extension/
├── manifest.json              # Extension manifest (Manifest V3)
├── background.js              # Service worker - main extension logic
├── config.js                  # Configuration module with defaults, validation, and migration
├── default-config.json        # Default empty configuration template
├── shortcuts.js               # Content script for keyboard shortcut handling
│
├── options.html               # Options page UI structure
├── options.css                # Options page styling
├── options.js                 # Options page logic and UI interactions
│
├── icons/                     # Extension icons (16, 24, 48, 128px)
│   ├── icon-16.png
│   ├── icon-24.png
│   ├── icon-48.png
│   └── icon-128.png
│
├── build/                     # Build output directory (ZIP files for distribution)
├── build.sh                   # Build script for creating distribution packages
│
├── docs/                      # Documentation files
│   ├── CHROME_WEB_STORE.md
│   ├── PERMISSIONS_JUSTIFICATION.md
│   ├── PROMOTIONAL_IMAGES.md
│   ├── SCREENSHOT_GUIDE.md
│   ├── STORE_LISTING.md
│   ├── SUBMISSION_CHECKLIST.md
│   └── TEST_VERSION_MIGRATION.md
│
├── images/                    # Promotional images and assets
├── screenshots/               # Chrome Web Store screenshots
├── samples/                   # Example configuration files
│
├── README.md                  # User-facing documentation
├── DEVELOPER.md               # This file
├── PRIVACY.md                 # Privacy policy
└── LICENSE                    # MIT License
```

## Component Details

### Core Extension Files

#### manifest.json
**Purpose**: Extension configuration and metadata
**Key Sections**:
- Permissions: `contextMenus`, `tabs`, `scripting`, `activeTab`, `storage`
- Host permissions: ChatGPT domains
- Service worker: background.js
- Content script: shortcuts.js (runs on all pages)
- Options page: options.html

#### background.js
**Purpose**: Service worker containing main extension logic
**Location**: Service worker (no DOM access)
**Key Responsibilities**:
- Context menu creation and management
- Keyboard shortcut command handling
- Tab management (creation, focusing, URL matching)
- Dynamic content script injection into ChatGPT pages
- Text selection capture and prompt construction
- Configuration loading and caching

**Key Functions** (with approximate line references):
- `runAllActions()`: Launches all enabled actions in parallel tabs
- `executeAction()`: Executes a single action with selected text
- `handleShortcutExecution()`: Processes keyboard shortcut triggers
- `rebuildContextMenus()`: Dynamically creates context menus from config
- `tryInjectWithTiming()`: Main injection logic with retry mechanism
- `pickEditor()`: Finds ChatGPT input field using multiple selector strategies
- `setValue()`: Inserts text using proper DOM APIs (React-compatible)
- `submit()`: Submits the prompt via button click or Enter key

#### config.js
**Purpose**: Configuration management module
**Key Features**:
- Version tracking (`CURRENT_CONFIG_VERSION`)
- Default configuration loading from default-config.json
- Configuration validation
- Automatic migration between schema versions
- Functions: `loadDefaultConfig()`, `migrateConfigVersion()`, `loadConfig()`, `saveConfig()`

**Migration System**: See config.js:34-90 for version migration logic

#### default-config.json
**Purpose**: Default empty configuration template
**Why Empty**: v2.1.0+ ships with empty actions array to prevent exposing default action prompts in published extension

#### shortcuts.js
**Purpose**: Content script for keyboard shortcut handling
**Scope**: Injected into all pages via manifest
**Runs at**: `document_start`
**Function**: Listens for keyboard events and sends messages to background.js when shortcuts are triggered

### Options Page

#### options.html
**Purpose**: Options page UI structure
**Access**: chrome://extensions → Details → Extension options
**Features**: Form-based configuration editor with drag-and-drop action reordering

#### options.js
**Purpose**: Options page logic
**Key Features**:
- Configuration loading/saving
- Dynamic action list management
- Keyboard shortcut capture
- Import/Export functionality
- Drag-and-drop reordering
- Real-time validation

#### options.css
**Purpose**: Options page styling with modern UI design

## Configuration System

### Storage Architecture

**Storage Type**: `chrome.storage.sync`
- Syncs across devices when user is logged into Chrome
- 100KB storage quota (more than sufficient for typical configurations)
- Asynchronous API (uses Promises)

### Configuration Schema (v2)

```javascript
{
  "version": 2,
  "globalSettings": {
    "customGptUrl": "https://chatgpt.com/g/g-...",
    "gptTitleMatch": "ChatGPT",
    "contextMenuTitle": "Send to ChatGPT",
    "clearContext": true,
    "autoSubmit": true,
    "runAllEnabled": false,
    "runAllShortcut": ""
  },
  "actions": [
    {
      "id": "unique-id",
      "label": "Action Name",
      "prompt": "Prompt template with {{text}} placeholder",
      "enabled": true,
      "shortcut": "Ctrl+Shift+1"
    }
  ]
}
```

### Configuration Versioning

**Current Version**: 2 (as of v2.1.1)

**Version History**:
- **v1**: Initial hardcoded configuration (pre-v2.0.0)
- **v2**: Introduced version field, dynamic configuration system

**Migration**: Automatic on first load. See config.js for migration logic.

### Configuration Validation

All configuration changes are validated in config.js before saving:
- URL format validation
- Required fields presence
- Action ID uniqueness
- Shortcut format validation

## How It Works

### Extension Flow

1. **User Triggers Action**
   - Via context menu (right-click)
   - Via keyboard shortcut
   - Via "Run All Actions" command

2. **Selection Capture** (background.js)
   - Captures selected text from active tab using `chrome.tabs.sendMessage`
   - Falls back to empty string if no selection

3. **Configuration Loading** (config.js)
   - Loads config from chrome.storage.sync
   - Applies migrations if needed
   - Caches in memory for performance

4. **Tab Management** (background.js)
   - Checks for existing ChatGPT tab matching `gptTitleMatch`
   - Creates new tab with `customGptUrl` or focuses existing tab
   - For "Run All": Creates multiple tabs in parallel while preserving action order

5. **Content Script Injection** (background.js → injected script)
   - Waits for tab to be ready
   - Injects script into ChatGPT page using `chrome.scripting.executeScript`
   - Script performs DOM manipulation directly in page context

6. **Text Injection** (injected script)
   - **Context Clearing** (if enabled): Clicks new chat button
   - **Editor Location**: Uses `pickEditor()` with multiple selector strategies:
     - Direct textarea query
     - contentEditable div query
     - Shadow DOM traversal
     - Visibility validation
   - **Text Insertion**: Uses `setValue()` with React-compatible approach:
     - Sets `value` property directly
     - Dispatches `input` and `change` events
     - Ensures React state synchronization

7. **Auto-Submit** (if enabled)
   - Attempts to click submit button
   - Falls back to Enter key dispatch if button not found

8. **Retry Logic**
   - If injection fails, waits 1.2 seconds and retries once
   - Uses fresh context on retry

9. **Deduplication**
   - Each request gets unique ID
   - Page-level state tracks last request within 10 seconds
   - Duplicate requests automatically skipped

### Keyboard Shortcuts Flow

1. **User presses shortcut** on any webpage
2. **shortcuts.js** (content script) captures keyboard event
3. **Message sent** to background.js with shortcut combination
4. **background.js** matches shortcut to action and executes

### Parallel Execution (Run All)

1. User triggers "Run All Actions"
2. Filters enabled actions
3. Captures selected text once
4. Creates separate tabs for each action in rapid succession
5. Each tab gets unique request ID to prevent deduplication conflicts
6. Order is preserved despite parallel creation

## Development Workflow

### Initial Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/frybynite/chatgpt-query-extension.git
   cd chatgpt-query-extension
   ```

2. **Load Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the extension directory

3. **Configure Extension**
   - Click "Extension options"
   - Set your custom GPT URL
   - Add test actions
   - Configure shortcuts

### Development Cycle

1. **Make Code Changes**
   - Edit JavaScript, HTML, or CSS files
   - No build step required

2. **Reload Extension**
   - Go to `chrome://extensions/`
   - Click reload icon for the extension
   - **Important**: Refresh any open webpages to reload content scripts

3. **Test Changes**
   - Select text on any webpage
   - Test context menu, shortcuts, and "Run All"
   - Check service worker console for logs

4. **Debug Issues**
   - See [Debugging](#debugging) section below

### Testing

#### Manual Testing Checklist

- [ ] Context menu appears on text selection
- [ ] Context menu items match configured actions
- [ ] Keyboard shortcuts trigger correct actions
- [ ] "Run All Actions" creates multiple tabs
- [ ] Text is correctly inserted into ChatGPT
- [ ] Auto-submit works (if enabled)
- [ ] Configuration persists after reload
- [ ] Import/Export functionality works
- [ ] Migration from old config version works

#### Test on Multiple Scenarios

- Different websites (content scripts may behave differently)
- Long text selections (>10KB)
- Special characters in text
- Rapid repeated triggers (deduplication test)
- ChatGPT page already open vs. new tab

## Build & Distribution

### Build Script (build.sh)

**Purpose**: Creates clean ZIP package for Chrome Web Store submission

**What It Does**:
1. Reads version from manifest.json
2. Creates temporary build directory
3. Copies only necessary files:
   - Core extension files (manifest.json, background.js, config.js, etc.)
   - Options page files (options.html, options.js, options.css)
   - Icons
   - LICENSE
4. Creates ZIP file: `build/chatgpt-custom-prompts-v{VERSION}.zip`
5. Cleans up temporary directory

**Files Excluded from Package**:
- Documentation (README.md, DEVELOPER.md, docs/)
- Development files (build.sh, .git/, .claude/)
- Images and screenshots (promotional materials)
- Sample configs

**Usage**:
```bash
./build.sh
```

**Output**: `build/chatgpt-custom-prompts-v{VERSION}.zip`

### Submission to Chrome Web Store

See docs/SUBMISSION_CHECKLIST.md for complete submission process.

**Quick Steps**:
1. Run `./build.sh`
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Upload ZIP file
4. Complete store listing (see docs/STORE_LISTING.md)
5. Add screenshots (see docs/SCREENSHOT_GUIDE.md)
6. Submit for review

## Common Modifications

### Adding a New Action Property

1. Update schema in `config.js`
2. Update validation logic
3. Add migration code if needed
4. Update `options.js` to include UI for new property
5. Update `background.js` to use new property
6. Increment `CURRENT_CONFIG_VERSION` if schema changes

### Changing Text Injection Logic

**Location**: background.js (injected script within `chrome.scripting.executeScript`)

**Common Changes**:
- Modify `pickEditor()` to handle new ChatGPT DOM structure
- Update selector strategies in background.js:130-139 (approximate)
- Adjust retry timing (currently 1.2 seconds)
- Change auto-submit behavior

### Adding New Permissions

1. Add to `manifest.json` permissions array
2. Document in docs/PERMISSIONS_JUSTIFICATION.md
3. Update README if user-facing
4. Resubmit to Chrome Web Store (requires review)

### Supporting Additional AI Platforms

**Current**: ChatGPT only
**To Add Support for Claude/etc**:

1. Add host permissions to manifest.json
2. Create platform-specific injection logic
3. Add platform detection in background.js
4. Update `pickEditor()` for new platform's DOM
5. Update configuration to allow multiple platform URLs

## Debugging

### Service Worker Console

**Access**:
1. Go to `chrome://extensions/`
2. Find "ChatGPT Custom Prompts"
3. Click "service worker" link
4. View console logs

**What You'll See**:
- Action execution logs
- Configuration loading
- Tab management events
- Injection success/failure
- Error messages

### Content Script Debugging

**Page Console**:
- Right-click on webpage → Inspect → Console
- View logs from shortcuts.js

**ChatGPT Page Console**:
- After injection, view injected script logs
- Check for DOM manipulation errors

### Common Issues & Solutions

#### "Could not auto-insert text" Error

**Cause**: ChatGPT DOM structure changed
**Fix**: Update selector logic in background.js `pickEditor()` function
**Debug**: Check ChatGPT page console for selector query results

#### Shortcuts Not Working

**Causes**:
- Content script not loaded (refresh page after extension reload)
- Shortcut conflict with another extension
- Page blocks keyboard events

**Debug**: Check page console for shortcuts.js logs

#### Configuration Not Persisting

**Cause**: chrome.storage.sync quota exceeded or permission missing
**Debug**: Check service worker console for storage errors
**Fix**: Verify `storage` permission in manifest.json

#### Context Menu Not Appearing

**Causes**:
- Context menus not rebuilt after config change
- Extension not properly loaded

**Debug**: Check service worker console for `rebuildContextMenus` logs
**Fix**: Reload extension

### Verbose Logging

Add debug logs in key functions:

```javascript
console.log('[Debug] Variable name:', value);
```

Log locations to add:
- Action execution start/end
- Tab creation/focusing
- Injection attempts
- Configuration loading
- Selector queries

### Performance Monitoring

Monitor service worker lifecycle:
- Chrome may terminate service worker after inactivity
- Configuration is cached but service worker restarts
- Check service worker console for startup logs

## Permissions Explained

### Required Permissions

- **contextMenus**: Create right-click menu items
- **tabs**: Query, create, and focus tabs
- **scripting**: Inject content scripts into ChatGPT pages
- **activeTab**: Read selected text from current tab
- **storage**: Store configuration in chrome.storage.sync

### Host Permissions

- **https://chatgpt.com/\***: Access to ChatGPT domain
- **https://chat.openai.com/\***: Access to legacy ChatGPT domain

All permissions are justified in docs/PERMISSIONS_JUSTIFICATION.md.

## Additional Resources

- **Chrome Extension Docs**: https://developer.chrome.com/docs/extensions/
- **Manifest V3 Migration**: https://developer.chrome.com/docs/extensions/mv3/intro/
- **chrome.storage API**: https://developer.chrome.com/docs/extensions/reference/storage/
- **chrome.scripting API**: https://developer.chrome.com/docs/extensions/reference/scripting/

## Contributing

For bugs, feature requests, or contributions:
1. Check existing issues on GitHub
2. Follow the development workflow above
3. Test thoroughly before submitting PR
4. Update documentation as needed
