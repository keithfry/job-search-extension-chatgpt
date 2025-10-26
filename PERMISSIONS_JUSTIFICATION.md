# Chrome Web Store - Permissions Justification

This document explains why ChatGPT Custom Prompts requires each permission.

## Requested Permissions

### 1. `contextMenus`
**Why:** Creates right-click menu options when text is selected.

**Usage:** When a user selects text on any webpage and right-clicks, the extension displays custom menu items (e.g., "Job Summary", "Fit Match") in the context menu. This allows users to quickly send selected text to their configured ChatGPT assistant with pre-defined prompts.

**Code Reference:** `background.js` - `rebuildContextMenus()` function creates dynamic menu items based on user configuration.

---

### 2. `tabs`
**Why:** Opens new tabs or focuses existing ChatGPT tabs.

**Usage:** When a user triggers an action (via context menu or keyboard shortcut), the extension needs to:
- Create a new tab with the user's custom GPT URL, OR
- Find and focus an existing ChatGPT tab

This ensures a smooth user experience without manual tab management.

**Code Reference:** `background.js` - `executeAction()` and `runAllActions()` functions use `chrome.tabs.create()` and `chrome.tabs.query()`.

---

### 3. `scripting`
**Why:** Injects the selected text into the ChatGPT interface.

**Usage:** After opening a ChatGPT tab, the extension needs to:
- Find the text input field on the ChatGPT page
- Insert the user's selected text
- Optionally click the submit button (if auto-submit is enabled)

This automation eliminates the need for users to manually paste text into ChatGPT.

**Code Reference:** `background.js` - `chrome.scripting.executeScript()` in `tryInjectWithTiming()` function injects code to populate the ChatGPT input field.

---

### 4. `activeTab`
**Why:** Reads the currently selected text from the active webpage.

**Usage:** When a user triggers an action, the extension needs to capture the text they've selected on the current page. This is the core functionality - allowing users to send selected text to ChatGPT.

**Code Reference:** `background.js` - `executeAction()` retrieves selected text via `chrome.tabs.sendMessage()`.

---

### 5. `storage`
**Why:** Saves user's configuration and preferences.

**Usage:** The extension stores:
- Custom GPT URL
- User-defined actions (titles, prompts, shortcuts)
- Extension settings (auto-submit, context menu title, etc.)

Uses `chrome.storage.sync` to sync settings across the user's Chrome browsers when signed into the same Google account.

**Code Reference:** `config.js` - `saveConfig()` and `getConfig()` functions use `chrome.storage.sync.set()` and `chrome.storage.sync.get()`.

---

### 6. Host Permissions: `https://chatgpt.com/*` and `https://chat.openai.com/*`
**Why:** Required to interact with ChatGPT pages.

**Usage:** The extension needs permission to:
- Inject content scripts into ChatGPT pages
- Find and populate the chat input field
- Trigger the submit button

**Code Reference:** `background.js` - `chrome.scripting.executeScript()` targets these domains specifically.

---

### 7. Content Script: `matches: ["<all_urls>"]`
**Why:** Keyboard shortcuts must work on ALL websites.

**Usage:** The extension provides customizable keyboard shortcuts (e.g., Alt+Shift+J) that allow users to trigger actions without using the mouse. For shortcuts to work consistently, the content script must be injected on all pages.

**Important Notes:**
- The content script (`shortcuts.js`) is minimal and only listens for keyboard events
- It does NOT read page content, track user activity, or collect data
- It only sends a message to the background script when a configured shortcut is pressed
- The script runs at `document_start` to ensure shortcuts are available as soon as the page loads

**Code Reference:**
- `shortcuts.js` - Lightweight keyboard listener (~100 lines)
- `manifest.json` - Content script configuration with `"matches": ["<all_urls>"]`

**Why not restrict to specific domains?**
Users expect keyboard shortcuts to work everywhere - whether they're on job sites, documentation pages, email, social media, or any other website where they might select text to analyze with ChatGPT.

---

## Security & Privacy

- **No data collection:** Extension does not collect, track, or transmit user data
- **No network requests:** Extension does not make any external API calls
- **Local storage only:** All data stays in Chrome's sync storage
- **Open source:** Complete source code available at https://github.com/frybynite/chatgpt-query-extension
- **MIT Licensed:** Users can audit and modify the code

## Minimal Permissions Principle

While we request `<all_urls>` for content scripts, we've minimized permissions wherever possible:
- No `cookies` permission
- No `webRequest` permission
- No `history` permission
- No access to sensitive user data

The extension only interacts with:
1. Selected text (when user explicitly triggers an action)
2. ChatGPT tabs (to insert text)
3. Chrome's sync storage (to save user preferences)

---

## Summary

Every permission is **essential** for the extension's core functionality:
- Capture selected text from any webpage
- Send it to the user's custom ChatGPT
- Provide keyboard shortcuts for productivity
- Save user preferences

We do not request any permissions beyond what is strictly necessary for these features.
