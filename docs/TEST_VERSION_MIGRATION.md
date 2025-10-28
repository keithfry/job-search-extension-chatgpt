# Version Migration Test Cases

## Test Environment Setup

1. Load extension in Chrome as unpacked extension
2. Open Chrome DevTools Console to monitor logs
3. Open extension options page

---

## Test Case 1: Fresh Install (No Existing Config)

**Objective:** Verify default config has version 2

**Steps:**
1. Install extension for the first time (or clear storage)
2. Open options page
3. Check console logs

**Expected Results:**
- ✅ Console shows: `[Config] No config found, using defaults`
- ✅ Console shows: `[Config] Validating config v2`
- ✅ Default config loaded with version 2
- ✅ No migration occurs

**How to Verify:**
```javascript
// In console
chrome.storage.sync.get('config', (result) => {
  console.log('Config version:', result.config?.version);
  // Should output: Config version: 2
});
```

---

## Test Case 2: Load Old Config (v1 - No Version Field)

**Objective:** Verify v1 config auto-migrates to v2

**Setup:**
```javascript
// Manually create v1 config (no version field)
const v1Config = {
  "actions": [
    {
      "enabled": true,
      "id": "test1",
      "order": 1,
      "prompt": "Test prompt",
      "shortcut": "Alt+Shift+T",
      "title": "Test Action"
    }
  ],
  "globalSettings": {
    "autoSubmit": true,
    "clearContext": true,
    "contextMenuTitle": "Send to ChatGPT",
    "customGptUrl": "https://chatgpt.com/g/g-test",
    "gptTitleMatch": "ChatGPT",
    "runAllEnabled": false,
    "runAllShortcut": ""
  }
};

chrome.storage.sync.set({ config: v1Config }, () => {
  console.log('v1 config saved');
  location.reload(); // Reload options page
});
```

**Steps:**
1. Run setup script in console
2. Watch console during page reload
3. Check storage after migration

**Expected Results:**
- ✅ Console shows: `[Config] Migrating from v1 to v2`
- ✅ Console shows: `[Config] Migration complete to v2`
- ✅ Console shows: `[Config] Saving migrated config`
- ✅ Console shows: `[Config] Validating config v2`
- ✅ Config now has `version: 2` in storage
- ✅ All actions and settings preserved
- ✅ Migration is transparent (no user notification)

**How to Verify:**
```javascript
// Check migrated config
chrome.storage.sync.get('config', (result) => {
  console.log('Migrated config:', result.config);
  console.log('Version:', result.config.version); // Should be 2
  console.log('Actions preserved:', result.config.actions.length > 0);
});
```

---

## Test Case 3: Load Current Config (v2)

**Objective:** Verify v2 config doesn't trigger unnecessary migration

**Setup:**
```javascript
// Manually create v2 config
const v2Config = {
  "version": 2,
  "actions": [
    {
      "enabled": true,
      "id": "test1",
      "order": 1,
      "prompt": "Test prompt",
      "shortcut": "Alt+Shift+T",
      "title": "Test Action"
    }
  ],
  "globalSettings": {
    "autoSubmit": true,
    "clearContext": true,
    "contextMenuTitle": "Send to ChatGPT",
    "customGptUrl": "https://chatgpt.com/g/g-test",
    "gptTitleMatch": "ChatGPT",
    "runAllEnabled": false,
    "runAllShortcut": ""
  }
};

chrome.storage.sync.set({ config: v2Config }, () => {
  console.log('v2 config saved');
  location.reload();
});
```

**Steps:**
1. Run setup script in console
2. Watch console during page reload

**Expected Results:**
- ✅ NO migration message in console
- ✅ Console shows: `[Config] Validating config v2`
- ✅ Config version remains 2
- ✅ No storage write operation

---

## Test Case 4: Import v1 Config (JSON File)

**Objective:** Verify imported v1 config migrates silently

**Setup:**
Create file `test-config-v1.json`:
```json
{
  "actions": [
    {
      "enabled": true,
      "id": "imported1",
      "order": 1,
      "prompt": "Imported prompt",
      "shortcut": "Alt+Shift+I",
      "title": "Imported Action"
    }
  ],
  "globalSettings": {
    "autoSubmit": false,
    "clearContext": true,
    "contextMenuTitle": "Imported Config",
    "customGptUrl": "https://chatgpt.com/g/g-imported",
    "gptTitleMatch": "ChatGPT",
    "runAllEnabled": true,
    "runAllShortcut": "Alt+Shift+A"
  }
}
```

**Steps:**
1. Open extension options page
2. Click "Import JSON"
3. Select `test-config-v1.json`
4. Click "OK" on confirmation dialog
5. Watch console logs

**Expected Results:**
- ✅ Success banner: "Configuration imported successfully!"
- ✅ NO mention of version upgrade in UI
- ✅ Console shows validation with version
- ✅ Imported settings appear in UI
- ✅ Config in storage has version: 2

**How to Verify:**
```javascript
chrome.storage.sync.get('config', (result) => {
  console.log('Imported config has version:', result.config.version); // Should be 2
  console.log('Settings preserved:', result.config.globalSettings.contextMenuTitle); // "Imported Config"
});
```

---

## Test Case 5: Import v2 Config (JSON File)

**Objective:** Verify imported v2 config works without migration

**Setup:**
Create file `test-config-v2.json`:
```json
{
  "version": 2,
  "actions": [
    {
      "enabled": true,
      "id": "imported2",
      "order": 1,
      "prompt": "V2 imported prompt",
      "shortcut": "Alt+Shift+V",
      "title": "V2 Action"
    }
  ],
  "globalSettings": {
    "autoSubmit": true,
    "clearContext": true,
    "contextMenuTitle": "V2 Config",
    "customGptUrl": "https://chatgpt.com/g/g-v2",
    "gptTitleMatch": "ChatGPT",
    "runAllEnabled": false,
    "runAllShortcut": ""
  }
}
```

**Steps:**
1. Open extension options page
2. Click "Import JSON"
3. Select `test-config-v2.json`
4. Click "OK" on confirmation dialog

**Expected Results:**
- ✅ Success banner: "Configuration imported successfully!"
- ✅ NO migration needed
- ✅ Console shows: `[Config] Validating config v2`
- ✅ Imported settings appear correctly

---

## Test Case 6: Export Config Includes Version

**Objective:** Verify exported config contains version field

**Steps:**
1. Open extension options page with any config
2. Click "Export JSON"
3. Save downloaded file
4. Open file in text editor

**Expected Results:**
- ✅ JSON file contains `"version": 2` at root level
- ✅ File structure:
```json
{
  "version": 2,
  "actions": [...],
  "globalSettings": {...}
}
```

---

## Test Case 7: Validation Logs Version Number

**Objective:** Verify validation always logs the config version

**Steps:**
1. Open options page with any config
2. Make any change
3. Click "Save"
4. Watch console

**Expected Results:**
- ✅ Console shows: `[Config] Validating config v2`

---

## Test Case 8: Invalid Config Falls Back to Default v2

**Objective:** Verify corrupted configs use default v2

**Setup:**
```javascript
// Save corrupted config
const corruptedConfig = {
  "version": 2,
  "actions": "not-an-array", // Invalid
  "globalSettings": {}
};

chrome.storage.sync.set({ config: corruptedConfig }, () => {
  console.log('Corrupted config saved');
  location.reload();
});
```

**Steps:**
1. Run setup script
2. Watch console logs

**Expected Results:**
- ✅ Console shows: `[Config] Validation failed, using defaults`
- ✅ Default config (v2) loaded
- ✅ Extension works normally

---

## Test Case 9: Migration Preserves All Data

**Objective:** Verify no data loss during v1 → v2 migration

**Setup:**
```javascript
// Create comprehensive v1 config
const complexV1Config = {
  "actions": [
    {
      "enabled": true,
      "id": "action1",
      "order": 1,
      "prompt": "Prompt 1",
      "shortcut": "Alt+Shift+1",
      "title": "Action One"
    },
    {
      "enabled": false,
      "id": "action2",
      "order": 2,
      "prompt": "Prompt 2",
      "shortcut": "",
      "title": "Action Two"
    },
    {
      "enabled": true,
      "id": "action3",
      "order": 3,
      "prompt": "Prompt 3",
      "shortcut": "Alt+Shift+3",
      "title": "Action Three"
    }
  ],
  "globalSettings": {
    "autoSubmit": false,
    "clearContext": false,
    "contextMenuTitle": "Custom Menu Title",
    "customGptUrl": "https://chatgpt.com/g/g-custom-id-12345",
    "gptTitleMatch": "Custom GPT Name",
    "runAllEnabled": true,
    "runAllShortcut": "Alt+Shift+R"
  }
};

chrome.storage.sync.set({ config: complexV1Config }, () => {
  console.log('Complex v1 config saved');
  location.reload();
});
```

**Steps:**
1. Run setup script
2. Wait for reload
3. Verify all data in UI

**Expected Results:**
- ✅ All 3 actions present in UI
- ✅ Action 2 correctly disabled
- ✅ All shortcuts preserved
- ✅ All global settings correct:
  - autoSubmit: unchecked
  - clearContext: preserved (not in UI but in config)
  - contextMenuTitle: "Custom Menu Title"
  - customGptUrl: "https://chatgpt.com/g/g-custom-id-12345"
  - runAllEnabled: checked
  - runAllShortcut: "Alt+Shift+R"

**How to Verify:**
```javascript
chrome.storage.sync.get('config', (result) => {
  const config = result.config;
  console.log('Version:', config.version); // 2
  console.log('Action count:', config.actions.length); // 3
  console.log('Action 2 enabled:', config.actions[1].enabled); // false
  console.log('Custom URL:', config.globalSettings.customGptUrl);
  console.log('Run All shortcut:', config.globalSettings.runAllShortcut);
});
```

---

## Test Case 10: Concurrent Tab Migration

**Objective:** Verify migration works correctly with multiple tabs

**Steps:**
1. Clear storage
2. Save v1 config
3. Open options page in 3 different tabs simultaneously
4. Watch all console logs

**Expected Results:**
- ✅ Only one migration should occur
- ✅ All tabs should load the migrated config
- ✅ No race conditions or errors
- ✅ Storage only written once

---

## Regression Tests

### After Any Future Version Changes

When incrementing to v3, v4, etc., run all above tests plus:

**Test Case R1: Multi-version Migration**
- Create v1 config
- Should migrate v1 → v2 → v3 (etc.)
- All migrations logged
- All data preserved through chain

**Test Case R2: Skip Intermediate Versions**
- If user goes from v1 → v4 directly
- Should apply all intermediate migrations
- No errors in console

---

## Console Log Checklist

During testing, verify these logs appear when appropriate:

- `[Config] No config found, using defaults`
- `[Config] Migrating from v1 to v2`
- `[Config] Migration complete to v2`
- `[Config] Saving migrated config`
- `[Config] Validating config v2`
- `[Config] Validation failed, using defaults`

---

## Quick Verification Commands

```javascript
// Check current config version
chrome.storage.sync.get('config', (r) => console.log('Version:', r.config?.version));

// Clear storage (reset for testing)
chrome.storage.sync.clear(() => console.log('Storage cleared'));

// View full config
chrome.storage.sync.get('config', (r) => console.log(JSON.stringify(r.config, null, 2)));
```

---

## Success Criteria

All tests pass when:
- ✅ v1 configs auto-upgrade to v2 silently
- ✅ v2 configs load without migration
- ✅ No data loss during migration
- ✅ No user-visible migration messages
- ✅ Console logs provide clear debugging info
- ✅ Export/import works correctly
- ✅ Default configs are v2
- ✅ Invalid configs fall back gracefully
