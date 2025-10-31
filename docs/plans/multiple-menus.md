# Multiple Menus Feature - Implementation Plan

**Status**: In Progress
**Branch**: `multiple-menus`
**Started**: 2025-10-31
**Target Version**: v3.0.0

## Overview

Transform the extension from supporting a single menu configuration to supporting multiple independent menus. Each menu will have:
- Its own name (which becomes the context menu title)
- Its own Custom GPT URL
- Its own Auto Submit setting
- Its own Run All configuration
- Its own list of actions

## User Requirements

1. Create multiple menu items
2. Each menu item has a separate menu title, custom GPT URL, "run all", "auto submit", and list of actions
3. User can create a new "prompt menu" (menu name becomes context menu title)
4. Each menu shows up separately in the Chrome context menu
5. Export/import is global (exports all menus)
6. Migration strategy for old settings format (V2 → V3)
7. New version file format required

## Design Decisions

Based on user feedback:

- ✅ **Per-menu Run All**: Each menu independently controls its Run All feature
- ✅ **List+Detail UI**: Left sidebar shows menu list, right panel shows selected menu details
- ✅ **Limit 10 menus**: Reasonable limit to prevent Chrome storage quota issues
- ✅ **Migration preserves name**: Old `contextMenuTitle` becomes the new menu's name

---

## Data Model Changes

### Current Format (V2)

```json
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
      "id": "action_123",
      "title": "Summarize",
      "prompt": "Please summarize:",
      "shortcut": "Ctrl+Shift+S",
      "enabled": true,
      "order": 1
    }
  ]
}
```

### New Format (V3)

```json
{
  "version": 3,
  "menus": [
    {
      "id": "menu_1730000000000_a1b2c",
      "name": "Send to ChatGPT",
      "customGptUrl": "https://chatgpt.com/g/g-...",
      "autoSubmit": true,
      "runAllEnabled": false,
      "runAllShortcut": "",
      "order": 1,
      "actions": [
        {
          "id": "action_123",
          "title": "Summarize",
          "prompt": "Please summarize:",
          "shortcut": "Ctrl+Shift+S",
          "enabled": true,
          "order": 1
        }
      ]
    }
  ],
  "globalSettings": {
    "gptTitleMatch": "ChatGPT",
    "clearContext": true
  }
}
```

### Key Changes

1. **New top-level `menus` array**: Contains all menu configurations
2. **Menu object structure**:
   - `id`: Unique identifier (format: `menu_<timestamp>_<random>`)
   - `name`: User-editable name (becomes context menu title)
   - `customGptUrl`: Per-menu GPT URL
   - `autoSubmit`: Per-menu auto-submit setting
   - `runAllEnabled`: Per-menu Run All toggle
   - `runAllShortcut`: Per-menu Run All shortcut
   - `order`: Display order in context menu
   - `actions`: Array of actions (moved from root level)
3. **Reduced globalSettings**: Only `gptTitleMatch` and `clearContext` remain global

---

## Migration Strategy (V2 → V3)

### Detection
- Check if `config.version === 2` or `config.version` is missing
- Check for presence of `globalSettings` and `actions` at root level

### Migration Steps

1. Create single menu object:
   ```javascript
   {
     id: `menu_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
     name: config.globalSettings.contextMenuTitle || "Send to ChatGPT",
     customGptUrl: config.globalSettings.customGptUrl,
     autoSubmit: config.globalSettings.autoSubmit,
     runAllEnabled: config.globalSettings.runAllEnabled || false,
     runAllShortcut: config.globalSettings.runAllShortcut || "",
     order: 1,
     actions: config.actions || []
   }
   ```

2. Create new V3 config:
   ```javascript
   {
     version: 3,
     menus: [menuObject],
     globalSettings: {
       gptTitleMatch: config.globalSettings.gptTitleMatch || "ChatGPT",
       clearContext: config.globalSettings.clearContext !== false
     }
   }
   ```

3. Save migrated config to storage
4. Return migrated config

### Edge Cases
- Missing `contextMenuTitle` → use "Send to ChatGPT" default
- Missing `actions` → empty array
- V1 config → migrate to V2 first, then V2 to V3

---

## UI Design

### Layout: List + Detail View

```
┌────────────────────────────────────────────────────────────┐
│  ChatGPT Custom Prompts - Configuration                   │
├────────────┬───────────────────────────────────────────────┤
│ Menus      │  Global Settings                              │
│ (sidebar)  │  ┌──────────────────────────────────────────┐ │
│            │  │ Export Settings  Import Settings          │ │
│            │  └──────────────────────────────────────────┘ │
│            │                                               │
│ [Work GPT] │  ─────────────────────────────────────────── │
│  Personal  │                                               │
│  Research  │  Menu Configuration: Work GPT                │
│            │  ┌──────────────────────────────────────────┐ │
│ + Add Menu │  │ Menu Name: [Work GPT              ]      │ │
│            │  │ Custom GPT URL: [https://...]           │ │
│ 3/10 menus │  │ □ Auto Submit                           │ │
│            │  │ □ Enable Run All Actions                │ │
│            │  │ Run All Shortcut: [None]  [⌨]           │ │
│            │  └──────────────────────────────────────────┘ │
│            │                                               │
│            │  Actions                      [+ Add Action] │
│            │  ┌──────────────────────────────────────────┐ │
│            │  │ ≡ Summarize              ↑ ↓ ×          │ │
│            │  │   Prompt: Please summarize:             │ │
│            │  │   Shortcut: Ctrl+Shift+S  [⌨]           │ │
│            │  │   ☑ Enabled                             │ │
│            │  └──────────────────────────────────────────┘ │
│            │                                               │
│            │  [Save]  [Delete Menu]                       │
└────────────┴───────────────────────────────────────────────┘
```

### Left Sidebar (20% width)
- **Menu List**: Scrollable list of all menus
- **Selected Highlight**: Active menu highlighted
- **Drag Handles**: Reorder menus by dragging
- **+ Add Menu Button**: At bottom of list
- **Counter**: Shows "X/10 menus" at bottom

### Right Panel (80% width)
- **Global Settings Section** (collapsible, at top):
  - Export Settings button
  - Import Settings button
  - Note: "Exports/imports all menus"

- **Menu Configuration** (main area):
  - Menu Name input (max 50 chars, real-time update)
  - Custom GPT URL input
  - Auto Submit checkbox
  - Run All Enabled checkbox
  - Run All Shortcut input (only visible if Run All enabled)

- **Actions Section**:
  - Existing action UI (unchanged functionality)
  - Scoped to current menu only
  - + Add Action button

- **Footer Buttons**:
  - Save button (saves current menu)
  - Delete Menu button (with confirmation dialog)

---

## Implementation Checklist

### Phase 1: Branch & Documentation
- [x] Create branch `multiple-menus`
- [x] Create this plan document
- [ ] Review plan with stakeholders

### Phase 2: Data Model (config.js, default-config.json)
- [ ] Bump `CURRENT_CONFIG_VERSION` to 3
- [ ] Define V3 data structure
- [ ] Implement `migrateV2toV3()` function
- [ ] Update `migrateConfigVersion()` to call V2→V3 migration
- [ ] Update `validateConfig()` for V3 structure:
  - [ ] Validate `menus` array exists and is array
  - [ ] Validate max 10 menus
  - [ ] Validate each menu structure
  - [ ] Check menu name required and trimmed
  - [ ] Validate shortcuts unique across ALL menus
  - [ ] Validate menu IDs are unique
- [ ] Update `getConfig()` to handle V3
- [ ] Update `saveConfig()` to handle V3
- [ ] Update `default-config.json` to V3 format
- [ ] Test migration with various V2 configs

### Phase 3: UI (options.html, options.css)
- [ ] Restructure HTML:
  - [ ] Add left sidebar container for menu list
  - [ ] Add right panel container for menu details
  - [ ] Move global settings to top section
  - [ ] Update export/import section
  - [ ] Add menu list template
  - [ ] Update action template (if needed)
- [ ] Update CSS:
  - [ ] Layout: flexbox/grid for sidebar+panel
  - [ ] Menu list styles (selected state, hover, drag)
  - [ ] Menu counter styles
  - [ ] Responsive adjustments
  - [ ] Delete menu button styles
- [ ] Add menu name character counter (50 max)

### Phase 4: Options Logic (options.js)
- [ ] Update state management:
  - [ ] Add `selectedMenuId` variable
  - [ ] Add `selectedMenu` getter
- [ ] Implement menu management:
  - [ ] `renderMenuList()` - populate sidebar
  - [ ] `selectMenu(menuId)` - load menu details
  - [ ] `createNewMenu()` - add menu with defaults
  - [ ] `deleteMenu(menuId)` - remove menu (confirmation)
  - [ ] `saveCurrentMenu()` - save selected menu
  - [ ] `reorderMenus()` - drag/drop support
  - [ ] `updateMenuCount()` - show "X/10 menus"
- [ ] Update existing functions:
  - [ ] `loadAndRender()` - load V3 config
  - [ ] `renderActions()` - scope to selected menu
  - [ ] `handleSave()` - save current menu only
  - [ ] `handleExport()` - export all menus
  - [ ] `handleImport()` - import and migrate if needed
- [ ] Add validation:
  - [ ] Check menu name not empty
  - [ ] Check shortcuts unique across all menus
  - [ ] Prevent deleting last menu (or create default)
  - [ ] Enforce max 10 menus
- [ ] Add menu name change listener (real-time validation)

### Phase 5: Background Script (background.js)
- [ ] Update `rebuildContextMenus()`:
  - [ ] Iterate over `config.menus` array
  - [ ] Create parent menu for each menu (id: `menu.id`, title: `menu.name`)
  - [ ] Create child items for each menu's actions (id: `${menuId}__${actionId}`)
  - [ ] Create per-menu Run All if enabled (id: `${menuId}__runAll`)
- [ ] Update `buildShortcutMap()`:
  - [ ] Iterate over all menus
  - [ ] Map shortcut → `{menuId, actionId}`
  - [ ] Include per-menu Run All shortcuts
- [ ] Update `chrome.contextMenus.onClicked`:
  - [ ] Parse `menuItemId` to extract `menuId` and `actionId`
  - [ ] Find correct menu from config
  - [ ] Use menu's `customGptUrl` and `autoSubmit`
  - [ ] Handle per-menu Run All
- [ ] Update `executeAction()`:
  - [ ] Accept menu parameter
  - [ ] Use menu's settings
- [ ] Update `runAllActions()`:
  - [ ] Accept menu parameter
  - [ ] Run only that menu's actions
- [ ] Update `handleShortcutExecution()`:
  - [ ] Find menu from shortcut map
  - [ ] Use menu's settings

### Phase 6: Testing
- [ ] Write Playwright tests:
  - [ ] Test: Navigate to options page, verify default menu
  - [ ] Test: Create new menu
  - [ ] Test: Edit menu name, verify title updates
  - [ ] Test: Add actions to multiple menus
  - [ ] Test: Delete menu (confirm dialog)
  - [ ] Test: Reorder menus via drag
  - [ ] Test: Export all menus
  - [ ] Test: Import V2 config, verify migration
  - [ ] Test: Import V3 config
- [ ] Manual testing:
  - [ ] V2 → V3 migration on fresh install
  - [ ] Multiple context menus appear in Chrome
  - [ ] Each menu's actions work correctly
  - [ ] Per-menu Run All works
  - [ ] Shortcuts work across menus
  - [ ] No shortcut conflicts
  - [ ] Chrome storage quota not exceeded

### Phase 7: Documentation
- [ ] Update README.md:
  - [ ] Document multiple menus feature
  - [ ] Update screenshots
  - [ ] Update configuration examples
- [ ] Update CHANGELOG.md:
  - [ ] Add v3.0.0 section
  - [ ] List breaking changes
  - [ ] Migration notes
- [ ] Update DEVELOPER.md if needed

### Phase 8: Finalize
- [ ] Code review
- [ ] Fix bugs from testing
- [ ] Performance check
- [ ] Create pull request
- [ ] Merge to main

---

## Technical Considerations

### Chrome Storage Limits
- `chrome.storage.sync` has quota limits:
  - Total: 102,400 bytes (~100 KB)
  - Per-item: 8,192 bytes (~8 KB)
- With 10 menus × 10 actions × ~200 bytes/action = ~20 KB (well within limits)
- Monitor storage usage in testing

### Context Menu Limits
- Chrome allows up to 6 top-level context menu items per extension
- With 10 menus, we exceed this limit
- **Solution**: Create expandable submenus or reduce max to 6 menus
- **Decision needed**: Keep 10 and accept Chrome's limitation, or reduce to 6?

### Shortcut Conflicts
- Must validate shortcuts globally across all menus
- Show clear error message if duplicate found
- Highlight conflicting menu/action in UI

### Menu ID Generation
- Format: `menu_<timestamp>_<random5char>`
- Ensures uniqueness
- Random component prevents collisions if created quickly

### Default Menu Behavior
- Never allow zero menus (breaks extension)
- If last menu deleted, either:
  - Prevent deletion (show error)
  - Create new default menu automatically
- **Recommendation**: Prevent deletion of last menu

---

## Edge Cases

### 1. Deleting the Only Menu
- **Scenario**: User has 1 menu and tries to delete it
- **Solution**: Prevent deletion, show error: "Cannot delete the last menu"

### 2. Duplicate Menu Names
- **Scenario**: User creates two menus with same name
- **Solution**: Allow but show warning in UI ("Another menu has this name")

### 3. Import V2 Config When on V3
- **Scenario**: User exports V2 from old version, imports to V3
- **Solution**: Detect V2 format, migrate on import, show success message

### 4. Import V3 with >10 Menus
- **Scenario**: User manually edits JSON to have 15 menus, imports
- **Solution**: Validation fails, show error, reject import

### 5. Shortcut Conflicts Across Menus
- **Scenario**: Menu A action has Ctrl+S, Menu B action has Ctrl+S
- **Solution**: Validation catches this, shows error with menu/action names

### 6. Chrome Context Menu Limit
- **Scenario**: User creates 7+ menus, Chrome only shows 6
- **Solution**: Document limitation, or implement dynamic overflow menu

### 7. Menu Name Too Long
- **Scenario**: User enters 100-character menu name
- **Solution**: Enforce max 50 chars, truncate or prevent input

### 8. Rapid Menu Creation
- **Scenario**: User clicks "+ Add Menu" 20 times quickly
- **Solution**: Check max limit before creating, disable button at limit

### 9. Storage Quota Exceeded
- **Scenario**: User creates massive config exceeding sync storage
- **Solution**: Catch storage error, show friendly message

### 10. Migration Fails Mid-Process
- **Scenario**: Error during V2→V3 migration
- **Solution**: Keep original config, log error, fallback to defaults

---

## Testing Scenarios

### Migration Tests
1. V2 config with 0 actions → V3 with 1 menu, 0 actions
2. V2 config with 5 actions → V3 with 1 menu, 5 actions
3. V2 config with custom settings → V3 preserves all settings
4. V1 config (no version field) → V3 via V2
5. Empty config → V3 with default menu

### UI Tests
1. Create menu → appears in list, becomes selected
2. Edit menu name → context menu updates
3. Delete menu → removed from list, next menu selected
4. Delete only menu → prevented, error shown
5. Create 11th menu → prevented, error shown
6. Drag reorder menus → order saved, context menu updates
7. Export → downloads file with all menus
8. Import V2 → migrates and loads successfully
9. Import V3 → loads successfully

### Functional Tests
1. Select text, right-click → see multiple menus
2. Click menu → see that menu's actions
3. Click action → opens correct GPT with correct settings
4. Per-menu Run All → runs only that menu's actions
5. Shortcuts work across menus → correct action triggered
6. Edit menu URL → actions use new URL
7. Toggle auto-submit → behavior changes
8. Disable action → removed from context menu

---

## Open Questions

1. **Context menu limit**: Keep 10 menus (Chrome may only show 6) or reduce to 6?
   - **Decision**: Keep 10, document limitation

2. **Last menu deletion**: Prevent or create default?
   - **Decision**: Prevent deletion, show error

3. **Duplicate menu names**: Allow, warn, or prevent?
   - **Decision**: Allow but show warning

4. **Global Run All**: Add option for cross-menu Run All?
   - **Decision**: Not in v3.0.0, defer to future version

5. **Menu icons**: Allow custom icons per menu?
   - **Decision**: Not in v3.0.0, defer to future version

---

## Success Criteria

- ✅ User can create up to 10 menus
- ✅ Each menu has independent settings and actions
- ✅ Context menu shows multiple menus
- ✅ V2 configs automatically migrate to V3
- ✅ Export/import works with all menus
- ✅ All existing functionality preserved
- ✅ No data loss during migration
- ✅ Playwright tests pass
- ✅ Manual testing confirms all scenarios work

---

## Parallel Execution Strategy

To speed up implementation, we can use subagents to work on independent pieces in parallel:

### Batch 1: Foundation (Sequential)
Must be completed first as other work depends on it:
- **Main agent**: Data model changes (config.js, default-config.json)
  - Update to V3 structure
  - Implement migration
  - Update validation

### Batch 2: Independent Components (Parallel)
Can be done simultaneously once Batch 1 is complete:
- **Subagent A**: UI HTML structure (options.html)
  - Create sidebar layout
  - Add menu list template
  - Restructure global settings section

- **Subagent B**: UI Styling (options.css)
  - Layout styles (flexbox/grid)
  - Menu list styles
  - Responsive adjustments

- **Subagent C**: Background script (background.js)
  - Multi-menu context menu building
  - Update click handlers
  - Update shortcut handling

### Batch 3: Integration (Sequential)
Requires Batch 2 completion:
- **Main agent**: Options page logic (options.js)
  - Integrate with new HTML structure
  - Implement menu management
  - Connect to config changes

### Batch 4: Quality Assurance (Parallel)
Can be done simultaneously:
- **Subagent A**: Playwright tests
  - Write automated tests for new features
  - Test migration scenarios

- **Subagent B**: Documentation
  - Update README.md
  - Update CHANGELOG.md
  - Add screenshots

### Batch 5: Finalization (Sequential)
- **Main agent**: Manual testing, bug fixes, code review

## Timeline Estimate

### Without Parallelization
- **Phase 1-2** (Data model): 4-6 hours
- **Phase 3** (UI redesign): 6-8 hours
- **Phase 4** (Options logic): 6-8 hours
- **Phase 5** (Background script): 4-6 hours
- **Phase 6** (Testing): 4-6 hours
- **Phase 7** (Documentation): 2-3 hours
- **Phase 8** (Review & fixes): 3-4 hours

**Total Sequential**: 29-41 hours (~4-5 days)

### With Parallelization (3 subagents)
- **Batch 1** (Foundation): 4-6 hours
- **Batch 2** (Parallel - 3 agents): 6-8 hours (longest of the 3)
- **Batch 3** (Integration): 6-8 hours
- **Batch 4** (Parallel - 2 agents): 4-6 hours (longest of the 2)
- **Batch 5** (Finalization): 3-4 hours

**Total Parallel**: 23-32 hours (~3-4 days) - **~25% faster**

---

## Notes

- Keep this document updated as implementation progresses
- Check off items in the Implementation Checklist as completed
- Document any deviations from the plan
- Note any additional edge cases discovered during implementation

---

**Last Updated**: 2025-10-31
