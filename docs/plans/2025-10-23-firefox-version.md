# Firefox Version Implementation Plan

**Date:** 2025-10-23
**Version:** 2.1.0 (cross-browser)
**Status:** Planning
**Approach:** Cross-browser with polyfill (single codebase, production-ready)

## Overview

Transform the Chrome-only ChatGPT Actions extension into a cross-browser extension that works seamlessly on both Chrome and Firefox, using a single codebase with Mozilla's webextension-polyfill for compatibility.

## Goals

1. **Single Codebase**: Maintain one set of source files for both browsers
2. **Production Ready**: Full testing and polish for Firefox Add-ons submission
3. **Feature Parity**: All features work identically on both browsers
4. **Automated Build**: Build process generates distribution packages for both browsers
5. **Long-term Maintainability**: Easy to update and test across browsers

## Current Architecture Analysis

### Chrome APIs Used
- `chrome.contextMenus` - 3 calls
- `chrome.tabs` - 9 calls
- `chrome.storage` - 6 calls
- `chrome.runtime` - 7 calls
- `chrome.scripting` - 1 call

### Key Features
- Manifest V3 with service worker
- ES6 modules throughout
- Content scripts for keyboard shortcuts
- Options page UI
- JSON config loading via fetch

### Compatibility Assessment

#### ✅ **High Compatibility** (No changes needed)
- Core WebExtension APIs (storage, contextMenus, tabs, scripting, runtime)
- Content scripts behavior
- HTML/CSS/JS in options page
- fetch() for JSON loading
- ES6 modules

#### ⚠️ **Requires Changes**
1. **Background Architecture**: Service worker (Chrome) vs scripts array (Firefox)
2. **API Namespace**: `chrome.*` (Chrome) vs `browser.*` (Firefox preferred)
3. **Manifest Differences**: Firefox requires `browser_specific_settings`

## Implementation Plan

### Phase 1: Setup Cross-Browser Foundation (2-3 hours)

#### 1.1 Add webextension-polyfill

Mozilla's official polyfill provides Promise-based `browser.*` API that works in both Chrome and Firefox.

**Tasks:**
1. Download `webextension-polyfill.js` from Mozilla
2. Add to project root
3. Update all HTML files to load polyfill first
4. Configure manifest to load polyfill before background script

**Files to create/modify:**
- `webextension-polyfill.js` (new, ~50KB)
- `options.html` - Add `<script src="webextension-polyfill.js"></script>`
- Manifests - Load polyfill in background scripts

#### 1.2 Update API Calls to Use `browser.*`

Replace all `chrome.*` calls with `browser.*` namespace. The polyfill provides this uniformly across browsers.

**Changes required:**

```javascript
// Before (Chrome-specific)
chrome.storage.sync.get('config', (result) => { ... });
chrome.tabs.create({ url: '...' }, (tab) => { ... });

// After (Cross-browser with Promises)
const result = await browser.storage.sync.get('config');
const tab = await browser.tabs.create({ url: '...' });
```

**Files to update:**
- `background.js` - All chrome.* calls
- `config.js` - chrome.storage, chrome.runtime
- `options.js` - chrome.storage
- `shortcuts.js` - chrome.runtime

**Specific replacements:**
- `chrome.storage` → `browser.storage` (6 occurrences)
- `chrome.runtime` → `browser.runtime` (7 occurrences)
- `chrome.tabs` → `browser.tabs` (9 occurrences)
- `chrome.contextMenus` → `browser.contextMenus` (3 occurrences)
- `chrome.scripting` → `browser.scripting` (1 occurrence)

#### 1.3 Create Browser-Specific Manifests

##### manifest-chrome.json

Minimal changes from current manifest.json:

```json
{
  "manifest_version": 3,
  "name": "ChatGPT Actions",
  "version": "2.1.0",
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
      "js": ["webextension-polyfill.js", "shortcuts.js"],
      "run_at": "document_start"
    }
  ],
  "options_page": "options.html",
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
```

##### manifest-firefox.json

Firefox-specific manifest with required differences:

```json
{
  "manifest_version": 3,
  "name": "ChatGPT Actions",
  "version": "2.1.0",
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
    "scripts": ["webextension-polyfill.js", "background.js"],
    "type": "module"
  },
  "browser_specific_settings": {
    "gecko": {
      "id": "chatgpt-actions@frybynite.com",
      "strict_min_version": "109.0"
    }
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["webextension-polyfill.js", "shortcuts.js"],
      "run_at": "document_start"
    }
  ],
  "options_page": "options.html",
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
```

**Key differences:**
1. `background`: service_worker (Chrome) vs scripts array (Firefox)
2. `browser_specific_settings` with extension ID (Firefox only)
3. `strict_min_version: "109.0"` ensures MV3 support

#### 1.4 Build System Setup

Create automated build script to generate distribution packages.

**build.js:**

```javascript
#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = 'dist';
const BROWSERS = ['chrome', 'firefox'];
const SOURCE_FILES = [
  'background.js',
  'config.js',
  'shortcuts.js',
  'options.html',
  'options.js',
  'options.css',
  'default-config.json',
  'webextension-polyfill.js',
  'icons'
];

async function build() {
  // Clean dist directory
  await fs.remove(DIST_DIR);
  await fs.mkdir(DIST_DIR);

  for (const browser of BROWSERS) {
    console.log(`Building for ${browser}...`);

    const distPath = path.join(DIST_DIR, browser);
    await fs.mkdir(distPath);

    // Copy source files
    for (const file of SOURCE_FILES) {
      await fs.copy(file, path.join(distPath, file));
    }

    // Copy browser-specific manifest
    await fs.copy(
      `manifest-${browser}.json`,
      path.join(distPath, 'manifest.json')
    );

    // Create ZIP for distribution
    const zipName = `chatgpt-actions-${browser}-v2.1.0.zip`;
    execSync(`cd ${distPath} && zip -r ../${zipName} .`);

    console.log(`✓ Created ${zipName}`);
  }

  console.log('\n✅ Build complete!');
  console.log(`   Chrome: ${DIST_DIR}/chatgpt-actions-chrome-v2.1.0.zip`);
  console.log(`   Firefox: ${DIST_DIR}/chatgpt-actions-firefox-v2.1.0.zip`);
}

build().catch(console.error);
```

**package.json scripts:**

```json
{
  "scripts": {
    "build": "node build.js",
    "build:chrome": "node build.js chrome",
    "build:firefox": "node build.js firefox"
  }
}
```

### Phase 2: Firefox-Specific Adjustments (1-2 hours)

#### 2.1 Options Page Integration

**Update options.html:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ChatGPT Actions - Configuration</title>
  <link rel="stylesheet" href="options.css">
  <!-- Load polyfill first -->
  <script src="webextension-polyfill.js"></script>
</head>
<body>
  <!-- existing content -->
  <script type="module" src="options.js"></script>
</body>
</html>
```

**Verify:**
- Module imports work in Firefox
- All DOM APIs work identically
- Form submission behaves the same
- Keyboard shortcut capture works

#### 2.2 Content Scripts Compatibility

**Update shortcuts.js header:**

```javascript
// Already loaded by manifest, but check availability
if (typeof browser === 'undefined') {
  console.error('[Shortcuts] browser API not available - extension may not work correctly');
}
```

**Test on multiple sites:**
- LinkedIn job postings
- Indeed listings
- Generic text pages
- Sites with complex DOM (React apps)

#### 2.3 Default Config Loading

**config.js fetch update:**

```javascript
async function loadDefaultConfig() {
  if (DEFAULT_CONFIG) return DEFAULT_CONFIG;

  try {
    // browser.runtime.getURL() works in both browsers with polyfill
    const response = await fetch(browser.runtime.getURL('default-config.json'));
    DEFAULT_CONFIG = await response.json();
    return DEFAULT_CONFIG;
  } catch (e) {
    console.error('[Config] Failed to load default config:', e);
    // Fallback config
    return { /* ... */ };
  }
}
```

### Phase 3: Testing & Polish (2-3 hours)

#### 3.1 Comprehensive Testing

**Firefox Testing Checklist:**

**Installation & Migration:**
- [ ] Fresh install - default config loads
- [ ] Automatic migration from v1.6.0 (if any Firefox users exist)
- [ ] Extension appears in Firefox toolbar
- [ ] Options page accessible via about:addons

**Core Functionality:**
- [ ] All 3 default actions work (Job Summary, Fit Match, Critical Fit Match)
- [ ] Context menu appears on text selection
- [ ] Context menu items are in correct order
- [ ] Individual actions send correct prompts
- [ ] Run All creates tabs in order, injects in parallel

**Configuration:**
- [ ] Options page loads correctly
- [ ] Can add new actions
- [ ] Can edit existing actions
- [ ] Can delete actions (except last one)
- [ ] Can reorder actions via drag-drop
- [ ] Can reorder actions via up/down buttons

**Keyboard Shortcuts:**
- [ ] Default shortcuts work (Alt+Shift+J, K, L, H)
- [ ] Can capture new shortcuts (keyboard icon)
- [ ] Shortcuts work with all modifier combinations
- [ ] Mac compatibility (Option key = Alt)
- [ ] Shortcuts don't interfere with browser shortcuts
- [ ] Extension reload requires page refresh (expected behavior)

**Run All Feature:**
- [ ] Enable/disable checkbox works
- [ ] Run All shortcut field shows/hides correctly
- [ ] Run All shortcut is customizable
- [ ] Run All creates all enabled actions
- [ ] Tabs appear in correct order
- [ ] All prompts inject successfully

**Import/Export:**
- [ ] Export JSON downloads file correctly
- [ ] Exported JSON is valid
- [ ] Import JSON validates before applying
- [ ] Import replaces current config
- [ ] Invalid JSON shows error message

**Storage & Sync:**
- [ ] Config saves to storage.sync
- [ ] Changes persist after browser restart
- [ ] Multiple Firefox profiles can have different configs
- [ ] Storage quota respected (100KB limit)

**Error Handling:**
- [ ] Extension reload doesn't cause duplicate menu errors
- [ ] Missing config falls back to defaults gracefully
- [ ] ChatGPT tab creation errors are handled
- [ ] Network errors don't break extension

#### 3.2 Firefox-Specific Features

**Private Browsing:**
- [ ] Extension works in private windows
- [ ] Storage sync behavior documented
- [ ] No sensitive data leaked

**Platform Testing:**
- [ ] Test on Firefox Linux (common platform)
- [ ] Test on Firefox macOS
- [ ] Test on Firefox Windows
- [ ] All keyboard shortcuts work on each platform

**Firefox DevTools:**
- [ ] Extension debugging works
- [ ] Console logs are clear and helpful
- [ ] Storage viewer shows config correctly
- [ ] No console errors during normal operation

#### 3.3 Manifest Polish

**Add proper icons** (create if don't exist):
- 16x16 for toolbar
- 48x48 for add-ons manager
- 128x128 for Firefox Add-ons website

**Update descriptions:**
```json
{
  "description": "Configurable actions to send selections to your custom ChatGPT assistant. Works on Chrome and Firefox.",
  "homepage_url": "https://github.com/frybynite/job-search-extension-chatgpt",
  "developer": {
    "name": "Keith Fry",
    "url": "https://github.com/frybynite"
  }
}
```

**Permissions review:**
- Ensure all permissions are necessary
- Add descriptions for each permission (Firefox shows these)
- Document why each permission is needed

#### 3.4 Documentation Updates

**Create docs/FIREFOX.md:**

```markdown
# Firefox Installation & Usage

## Installing from Firefox Add-ons

1. Visit [Firefox Add-ons page] (when published)
2. Click "Add to Firefox"
3. Grant requested permissions
4. Configure via Tools → Add-ons → ChatGPT Actions → Options

## Installing from Source (Developer)

1. Download the source code
2. Open Firefox and go to `about:debugging`
3. Click "This Firefox" → "Load Temporary Add-on"
4. Select `manifest-firefox.json` from the extension directory
5. Extension loads temporarily (until Firefox restart)

## Firefox-Specific Notes

### Keyboard Shortcuts
- On macOS, use Option instead of Alt
- Some system shortcuts take precedence (cannot be overridden)
- After extension reload, refresh pages to reload shortcut handler

### Storage Sync
- Firefox sync requires Firefox Account
- Without sync, config is local only
- Chrome sync and Firefox sync are separate

### Known Issues
- None currently

## Differences from Chrome Version

Both versions have feature parity. The only differences are:
- Background script architecture (transparent to users)
- Manifest format (not user-visible)
- API calls use browser.* namespace (internal)
```

**Update README.md:**

Add Firefox section:

```markdown
## Installation

### Chrome Web Store
[Install from Chrome Web Store]

### Firefox Add-ons
[Install from Firefox Add-ons]

### From Source
See [FIREFOX.md](docs/FIREFOX.md) for Firefox-specific instructions.
```

**Create docs/BUILDING.md:**

Document the build process, cross-browser testing workflow, and release procedure.

### Phase 4: Distribution Setup (1 hour)

#### 4.1 Build & Package

**Setup build scripts:**

```json
{
  "name": "chatgpt-actions",
  "version": "2.1.0",
  "scripts": {
    "build": "node build.js",
    "build:chrome": "node build.js chrome",
    "build:firefox": "node build.js firefox",
    "test": "echo 'Run manual tests' && exit 1",
    "package": "npm run build && echo 'Packages created in dist/'"
  },
  "devDependencies": {
    "fs-extra": "^10.0.0"
  }
}
```

**Test packages:**
1. Build both versions
2. Load Chrome version in Chrome
3. Load Firefox version in Firefox
4. Verify all features work
5. Check ZIP file structure

**Version management:**
- Keep version numbers in sync between browsers
- Tag releases: `v2.1.0-cross-browser`
- Update both manifests for each release

#### 4.2 Firefox Add-ons Submission Prep

**Create Firefox Add-ons developer account:**
- Go to addons.mozilla.org
- Sign in with Firefox Account
- Submit developer profile

**Prepare submission materials:**

**Screenshots** (Firefox-specific):
1. Options page
2. Context menu in action
3. Multiple tabs from Run All
4. Before/after comparison

**Description:**
```
Send selected text
to your custom ChatGPT assistant with a simple right-click.

Features:
• Configurable actions with custom prompts
• Keyboard shortcuts for quick access
• Run All to analyze with multiple perspectives
• Import/Export configurations
• Mac compatible

Perfect for job seekers who use ChatGPT for job fit analysis
and cover letter assistance.
```

**Privacy Policy:**
```
This extension:
- Stores configuration in browser sync storage only
- Does not collect any personal data
- Does not send data to external servers (except ChatGPT)
- All data stays local or in your browser's sync storage
```

**Review Firefox Add-ons Policies:**
- No obfuscated code (we're good)
- No minification (we're good)
- Source code review (provide GitHub link)
- All permissions justified (document each)

**Submission checklist:**
- [ ] All features tested thoroughly
- [ ] No console errors
- [ ] Icons included (16, 48, 128)
- [ ] Screenshots prepared
- [ ] Description written
- [ ] Privacy policy documented
- [ ] Source code available (GitHub)
- [ ] Version number correct
- [ ] Permissions documented

### Phase 5: Ongoing Maintenance

#### 5.1 Development Workflow

**For every change:**

1. Develop in Chrome (faster dev tools)
2. Test in Firefox immediately
3. Run build script
4. Test both packages
5. Commit to git
6. Tag release
7. Build final packages
8. Submit to both stores (if needed)

**Cross-browser testing checklist:**
- [ ] Feature works in Chrome
- [ ] Feature works in Firefox
- [ ] No console errors in either browser
- [ ] Behavior is identical (or documented differences)

#### 5.2 Browser-Specific Issues

**Document quirks:**
- Keep `docs/BROWSER_QUIRKS.md` with any differences found
- Note API inconsistencies
- Document workarounds

**Monitor changes:**
- Chrome extension API changes
- Firefox WebExtension API changes
- Manifest V3 updates
- webextension-polyfill updates

**Update strategy:**
- Test new browser versions in Beta/Nightly
- Update polyfill when new version releases
- Keep both manifests in sync for features

## File Structure After Implementation

```
job-search-extension-chatgpt/
├── manifest-chrome.json          # Chrome-specific manifest
├── manifest-firefox.json         # Firefox-specific manifest
├── webextension-polyfill.js      # Mozilla's polyfill (~50KB)
├── background.js                 # Updated to use browser.*
├── config.js                     # Updated to use browser.*
├── shortcuts.js                  # Updated to use browser.*
├── options.js                    # Updated to use browser.*
├── options.html                  # Loads polyfill
├── options.css                   # No changes
├── default-config.json           # No changes
├── build.js                      # NEW: Build script
├── package.json                  # NEW: NPM scripts
├── icons/                        # NEW: Extension icons
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── dist/                         # Generated by build
│   ├── chrome/
│   │   ├── manifest.json
│   │   └── ... (all source files)
│   ├── firefox/
│   │   ├── manifest.json
│   │   └── ... (all source files)
│   ├── chatgpt-actions-chrome-v2.1.0.zip
│   └── chatgpt-actions-firefox-v2.1.0.zip
├── docs/
│   ├── FIREFOX.md                # NEW: Firefox-specific docs
│   ├── BUILDING.md               # NEW: Build process docs
│   ├── BROWSER_QUIRKS.md         # NEW: Browser differences
│   └── plans/
│       ├── 2025-10-22-configurable-actions-design.md
│       └── 2025-10-23-firefox-version.md
└── README.md                     # Updated with Firefox info
```

## Risks & Mitigation

### Risk 1: Polyfill Causes Performance Issues
**Likelihood:** Low
**Impact:** Medium
**Mitigation:**
- Use official Mozilla polyfill (well-tested)
- Polyfill is only ~50KB
- No performance issues reported in other extensions
- Can remove later if Firefox adds native chrome.* support

### Risk 2: Firefox MV3 Differences Break Features
**Likelihood:** Low
**Impact:** High
**Mitigation:**
- Firefox MV3 has been stable since v109 (Jan 2023)
- Comprehensive testing phase catches issues early
- Most APIs are identical between browsers
- Background script difference is handled by manifest

### Risk 3: Breaking Changes to Chrome Version
**Likelihood:** Low
**Impact:** High
**Mitigation:**
- Test both browsers for every change
- Automated build ensures both get same code
- Version numbers stay in sync
- Chrome can also use browser.* with polyfill (no downside)

### Risk 4: Build Process Adds Complexity
**Likelihood:** Medium
**Impact:** Low
**Mitigation:**
- Simple Node.js script, no complex tools
- Well-documented in BUILDING.md
- Can manually copy files if build breaks
- Script is ~50 lines of straightforward code

### Risk 5: Firefox Add-ons Review Delays
**Likelihood:** Medium
**Impact:** Low
**Mitigation:**
- Simple extensions often auto-reviewed
- Provide GitHub link for source review
- No obfuscation or minification
- Clear privacy policy

## Success Criteria

v2.1.0 (Cross-browser) will be considered successful when:

1. ✅ Single codebase works in both Chrome and Firefox
2. ✅ All features have identical behavior (or documented differences)
3. ✅ Automated build process generates both packages
4. ✅ Both packages install and work correctly
5. ✅ No regressions in Chrome version
6. ✅ Production-ready for Firefox Add-ons submission
7. ✅ Comprehensive documentation for both browsers
8. ✅ Testing checklist completed for both browsers
9. ✅ Source code available on GitHub
10. ✅ Ongoing development workflow documented

## Estimated Effort

| Phase | Tasks | Time |
|-------|-------|------|
| Phase 1: Cross-Browser Foundation | Polyfill, API updates, manifests, build script | 2-3 hours |
| Phase 2: Firefox Adjustments | Options, content scripts, config loading | 1-2 hours |
| Phase 3: Testing & Polish | Testing, docs, manifest polish | 2-3 hours |
| Phase 4: Distribution | Build process, submission prep | 1 hour |
| Phase 5: Ongoing | Development workflow setup | Ongoing |
| **Total** | | **6-9 hours** |

Additional time for Firefox Add-ons review response: Variable (1-7 days)

## Timeline

**Week 1:**
- Days 1-2: Phase 1 (Foundation)
- Day 3: Phase 2 (Firefox adjustments)

**Week 2:**
- Days 1-2: Phase 3 (Testing & polish)
- Day 3: Phase 4 (Distribution prep)
- Submit to Firefox Add-ons
- Wait for review

**Week 3:**
- Address any review feedback
- Publish to Firefox Add-ons
- Update documentation with store links

## Future Enhancements

Out of scope for v2.1.0 but possible for future:

1. **Safari Support** - Apple's browser also supports WebExtensions (with quirks)
2. **Edge Support** - Currently works with Chrome version (Edge uses Chromium)
3. **CI/CD Pipeline** - Automated testing and building
4. **Automated Browser Testing** - Selenium/Puppeteer tests
5. **Store Auto-Publishing** - Automated submission after tests pass
6. **Multi-language Support** - i18n for international users
7. **Alternative AI Services** - Support Claude, Gemini, etc.

---

**Plan Created By:** Claude Code
**Review Status:** Pending user review
**Ready to Implement:** After user approval
