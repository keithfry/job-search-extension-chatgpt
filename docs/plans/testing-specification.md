# Multiple Menus Feature - Testing Specification

**Status**: Not Started
**Phase**: 6 - Testing
**Created**: 2025-11-01
**Last Updated**: 2025-11-01

---

## Overview

This document tracks all automated and manual tests for the Multiple Menus feature (v3.0.0). Each test includes:
- Test ID and description
- What functionality it covers
- Implementation status
- Pass/fail status

---

## Test Categories

1. [Migration Tests](#migration-tests) - V2 → V3 config migration
2. [UI Tests](#ui-tests) - Options page functionality
3. [Context Menu Tests](#context-menu-tests) - Chrome context menu behavior
4. [Action Execution Tests](#action-execution-tests) - Action triggering and execution
5. [Shortcut Tests](#shortcut-tests) - Keyboard shortcuts
6. [Storage Tests](#storage-tests) - Chrome storage integration
7. [Edge Case Tests](#edge-case-tests) - Error handling and boundaries

---

## Migration Tests

### TEST-M01: Migrate V2 config with no actions
- **Description**: V2 config with empty actions array migrates to V3 with single menu
- **Coverage**: Migration logic, empty state handling
- **Type**: Unit test
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/migration/migrate-v2-empty.spec.js`

### TEST-M02: Migrate V2 config with multiple actions
- **Description**: V2 config with 5 actions migrates to V3 preserving all actions
- **Coverage**: Migration logic, action preservation
- **Type**: Unit test
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/migration/migrate-v2-actions.spec.js`

### TEST-M03: Migrate V2 config with custom settings
- **Description**: V2 config with custom URL, title, shortcuts preserved in V3
- **Coverage**: Migration logic, settings preservation
- **Type**: Unit test
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/migration/migrate-v2-settings.spec.js`

### TEST-M04: Migrate V2 with Run All enabled
- **Description**: V2 with runAllEnabled and shortcut migrates correctly
- **Coverage**: Migration logic, Run All feature preservation
- **Type**: Unit test
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/migration/migrate-v2-runall.spec.js`

### TEST-M05: Migrate V1 config via V2 to V3
- **Description**: V1 config (no version field) migrates through V2 to V3
- **Coverage**: Multi-step migration, backward compatibility
- **Type**: Unit test
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/migration/migrate-v1-to-v3.spec.js`

### TEST-M06: Default config on fresh install
- **Description**: Fresh install creates valid V3 default config
- **Coverage**: Default config generation
- **Type**: Integration test
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/migration/fresh-install.spec.js`

---

## UI Tests

### TEST-UI01: Load options page with default menu
- **Description**: Navigate to options page, verify default menu appears
- **Coverage**: Initial page load, default state rendering
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/ui/default-menu.spec.js`

### TEST-UI02: Create new menu
- **Description**: Click "+ Add Menu", verify new menu created and selected
- **Coverage**: Menu creation, UI update, state management
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/ui/create-menu.spec.js`

### TEST-UI03: Edit menu name
- **Description**: Change menu name, verify updates in sidebar and details
- **Coverage**: Menu name editing, real-time updates
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/ui/edit-menu-name.spec.js`

### TEST-UI04: Delete menu with confirmation
- **Description**: Click delete, verify confirmation dialog, confirm deletion
- **Coverage**: Menu deletion, confirmation flow
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/ui/delete-menu.spec.js`

### TEST-UI05: Delete last menu allowed
- **Description**: Delete all menus down to zero, verify allowed
- **Coverage**: Deletion logic, no minimum menu requirement
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/ui/delete-last-menu.spec.js`

### TEST-UI06: Create 10 menus (max limit)
- **Description**: Create menus up to limit, verify 11th blocked
- **Coverage**: Maximum menu limit enforcement
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/ui/max-menus.spec.js`

### TEST-UI07: Switch between menus
- **Description**: Click different menus in list, verify details update
- **Coverage**: Menu selection, detail panel updates
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/ui/switch-menus.spec.js`

### TEST-UI08: Add actions to multiple menus
- **Description**: Create 2 menus, add different actions to each
- **Coverage**: Action scoping per menu
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/ui/actions-per-menu.spec.js`

### TEST-UI09: Reorder menus via drag-and-drop
- **Description**: Drag menu to different position, verify order saved
- **Coverage**: Menu reordering, drag-and-drop
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/ui/reorder-menus.spec.js`

### TEST-UI10: Toggle Run All per menu
- **Description**: Enable Run All for one menu, verify independent of others
- **Coverage**: Per-menu Run All configuration
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/ui/toggle-runall.spec.js`

### TEST-UI11: Save menu changes
- **Description**: Edit menu, click Save, reload page, verify persisted
- **Coverage**: Save functionality, persistence
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/ui/save-menu.spec.js`

### TEST-UI12: Menu counter display
- **Description**: Verify "X/10 menus" counter updates correctly
- **Coverage**: Menu count display
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/ui/menu-counter.spec.js`

---

## Context Menu Tests

### TEST-CM01: Multiple menus in context menu
- **Description**: Right-click selected text, verify all menus appear
- **Coverage**: Context menu rendering, multi-menu display
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/context-menu/multiple-menus.spec.js`

### TEST-CM02: Menu actions appear under correct parent
- **Description**: Verify actions grouped under their respective menu
- **Coverage**: Context menu hierarchy
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/context-menu/menu-hierarchy.spec.js`

### TEST-CM03: Context menu updates on config change
- **Description**: Add action in options, verify appears in context menu
- **Coverage**: Dynamic context menu updates
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/context-menu/dynamic-update.spec.js`

### TEST-CM04: Disabled actions not shown
- **Description**: Disable action, verify not in context menu
- **Coverage**: Action enable/disable
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/context-menu/disabled-actions.spec.js`

### TEST-CM05: Run All appears when enabled
- **Description**: Enable Run All for menu, verify appears in context menu
- **Coverage**: Per-menu Run All display
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/context-menu/runall-display.spec.js`

---

## Action Execution Tests

### TEST-AE01: Execute action from menu 1
- **Description**: Click action in first menu, verify opens correct GPT URL
- **Coverage**: Action execution, URL routing
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/execution/action-menu1.spec.js`

### TEST-AE02: Execute action from menu 2
- **Description**: Click action in second menu, verify uses menu 2's URL
- **Coverage**: Per-menu URL configuration
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/execution/action-menu2.spec.js`

### TEST-AE03: Auto-submit enabled
- **Description**: Execute action with auto-submit on, verify prompt submitted
- **Coverage**: Auto-submit functionality
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/execution/auto-submit.spec.js`

### TEST-AE04: Auto-submit disabled
- **Description**: Execute action with auto-submit off, verify prompt not submitted
- **Coverage**: Auto-submit toggle
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/execution/no-auto-submit.spec.js`

### TEST-AE05: Prompt text injection
- **Description**: Verify selected text + prompt correctly inserted
- **Coverage**: Text injection, prompt formatting
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/execution/prompt-injection.spec.js`

### TEST-AE06: Run All executes all menu actions
- **Description**: Click Run All, verify all actions in menu execute
- **Coverage**: Run All functionality
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/execution/runall-execute.spec.js`

### TEST-AE07: Run All only affects one menu
- **Description**: Run All on menu 1, verify menu 2 actions not executed
- **Coverage**: Per-menu Run All scope
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/execution/runall-scope.spec.js`

---

## Shortcut Tests

### TEST-SH01: Action shortcut menu 1
- **Description**: Press shortcut for menu 1 action, verify executes
- **Coverage**: Keyboard shortcuts, action triggering
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/shortcuts/action-menu1.spec.js`

### TEST-SH02: Action shortcut menu 2
- **Description**: Press shortcut for menu 2 action, verify uses menu 2 settings
- **Coverage**: Per-menu shortcut routing
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/shortcuts/action-menu2.spec.js`

### TEST-SH03: Shortcut conflict detection
- **Description**: Assign duplicate shortcut, verify error shown
- **Coverage**: Shortcut validation, conflict detection
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/shortcuts/conflict-detection.spec.js`

### TEST-SH04: Run All shortcut per menu
- **Description**: Press Run All shortcut for specific menu, verify only that menu runs
- **Coverage**: Per-menu Run All shortcuts
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/shortcuts/runall-shortcut.spec.js`

### TEST-SH05: Shortcut updates after config change
- **Description**: Change shortcut in options, verify new shortcut works
- **Coverage**: Dynamic shortcut updates
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/shortcuts/shortcut-update.spec.js`

### TEST-SH06: No shortcut interference in input fields
- **Description**: Type shortcut combo in text field, verify not triggered
- **Coverage**: Shortcut scoping, input field exclusion
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/shortcuts/input-exclusion.spec.js`

---

## Storage Tests

### TEST-ST01: Export all menus
- **Description**: Export config, verify JSON contains all menus
- **Coverage**: Export functionality
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/storage/export-all.spec.js`

### TEST-ST02: Import V3 config
- **Description**: Import V3 JSON, verify all menus loaded
- **Coverage**: Import functionality, V3 format
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/storage/import-v3.spec.js`

### TEST-ST03: Import V2 config with migration
- **Description**: Import V2 JSON, verify auto-migrates to V3
- **Coverage**: Import with migration
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/storage/import-v2-migrate.spec.js`

### TEST-ST04: Chrome storage sync
- **Description**: Save config, verify stored in chrome.storage.sync
- **Coverage**: Storage API integration
- **Type**: Integration test
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/storage/sync-storage.spec.js`

### TEST-ST05: Storage quota not exceeded
- **Description**: Create 10 menus with 10 actions each, verify storage OK
- **Coverage**: Storage quota limits
- **Type**: Integration test
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/storage/quota-check.spec.js`

---

## Edge Case Tests

### TEST-EC01: Empty menu name validation
- **Description**: Try to save menu with empty name, verify error shown
- **Coverage**: Validation, empty name handling
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/edge-cases/empty-name.spec.js`

### TEST-EC02: Menu name max length (50 chars)
- **Description**: Enter 51 character name, verify truncated/prevented
- **Coverage**: Input validation, maxlength enforcement
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/edge-cases/name-max-length.spec.js`

### TEST-EC03: Duplicate menu names allowed
- **Description**: Create two menus with same name, verify both saved
- **Coverage**: Duplicate name handling
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/edge-cases/duplicate-names.spec.js`

### TEST-EC04: Invalid GPT URL
- **Description**: Enter malformed URL, verify validation error
- **Coverage**: URL validation
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/edge-cases/invalid-url.spec.js`

### TEST-EC05: Import invalid JSON
- **Description**: Import malformed JSON, verify error message
- **Coverage**: Import validation, error handling
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/edge-cases/invalid-import.spec.js`

### TEST-EC06: Import config with >10 menus
- **Description**: Import JSON with 15 menus, verify rejected/truncated
- **Coverage**: Import validation, max limit enforcement
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/edge-cases/import-over-limit.spec.js`

### TEST-EC07: Rapid menu creation
- **Description**: Click "+ Add Menu" 20 times rapidly, verify max 10 created
- **Coverage**: Rate limiting, max limit enforcement
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/edge-cases/rapid-creation.spec.js`

### TEST-EC08: Menu deletion with unsaved changes
- **Description**: Edit menu, delete without saving, verify no error
- **Coverage**: Unsaved changes handling
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/edge-cases/delete-unsaved.spec.js`

### TEST-EC09: Extension reload during action execution
- **Description**: Trigger action, reload extension, verify graceful handling
- **Coverage**: Extension lifecycle, error handling
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/edge-cases/reload-during-action.spec.js`

### TEST-EC10: No selected text for shortcut
- **Description**: Press shortcut with no text selected, verify no action
- **Coverage**: Selection validation
- **Type**: E2E test (Playwright)
- **Implementation**: [ ] Not started
- **Status**: [ ] Not tested
- **Test Location**: `tests/edge-cases/no-selection.spec.js`

---

## Test Statistics

### By Category
- Migration Tests: 0/6 implemented, 0/6 passing
- UI Tests: 0/12 implemented, 0/12 passing
- Context Menu Tests: 0/5 implemented, 0/5 passing
- Action Execution Tests: 0/7 implemented, 0/7 passing
- Shortcut Tests: 0/6 implemented, 0/6 passing
- Storage Tests: 0/5 implemented, 0/5 passing
- Edge Case Tests: 0/10 implemented, 0/10 passing

### Overall
- **Total Tests**: 51
- **Implemented**: 0/51 (0%)
- **Passing**: 0/51 (0%)
- **Failing**: 0/51 (0%)

---

## Test Priorities

### Priority 1 (Critical - Core Functionality)
1. TEST-UI01 - Load options page with default menu
2. TEST-UI02 - Create new menu
3. TEST-UI08 - Add actions to multiple menus
4. TEST-CM01 - Multiple menus in context menu
5. TEST-AE01 - Execute action from menu 1
6. TEST-AE02 - Execute action from menu 2
7. TEST-M02 - Migrate V2 config with actions
8. TEST-ST01 - Export all menus
9. TEST-ST02 - Import V3 config

### Priority 2 (Important - Key Features)
10. TEST-UI03 - Edit menu name
11. TEST-UI04 - Delete menu
12. TEST-UI07 - Switch between menus
13. TEST-AE06 - Run All executes all menu actions
14. TEST-SH01 - Action shortcut menu 1
15. TEST-SH02 - Action shortcut menu 2
16. TEST-SH03 - Shortcut conflict detection
17. TEST-CM03 - Context menu updates on config change

### Priority 3 (Nice to Have - Polish)
18. TEST-UI06 - Create 10 menus (max limit)
19. TEST-UI09 - Reorder menus
20. TEST-EC01 - Empty menu name validation
21. TEST-EC07 - Rapid menu creation
22. All remaining edge case tests

---

## Running Tests

### Setup
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Run All Tests
```bash
npm test
```

### Run Specific Category
```bash
npx playwright test tests/ui/
npx playwright test tests/migration/
npx playwright test tests/shortcuts/
```

### Run Single Test
```bash
npx playwright test tests/ui/create-menu.spec.js
```

### Debug Mode
```bash
npx playwright test --debug
```

---

## Notes

- Tests should be run against a clean extension state when possible
- Use test fixtures for common setup scenarios
- Mock chrome.storage.sync for unit tests
- Use actual chrome.storage.sync for integration tests
- Record test failures with screenshots/videos
- Update this document as tests are implemented and pass

---

**Last Updated**: 2025-11-01
