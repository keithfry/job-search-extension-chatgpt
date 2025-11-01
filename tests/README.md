# Test Suite

Automated tests for the ChatGPT Custom Prompts Chrome Extension using Playwright.

## Setup Complete ✅

- Playwright installed and configured
- Test directory structure created
- Chrome extension testing fixtures ready
- Smoke tests passing

## Running Tests

### All tests
```bash
npm test
```

### Smoke tests only
```bash
npm run test:smoke
```

### Specific category
```bash
npm run test:ui      # UI tests only
```

### Debug mode (step through tests)
```bash
npm run test:debug
```

### View test report
```bash
npm run test:report
```

## Test Structure

```
tests/
├── fixtures/           # Shared test utilities
│   └── extension.js   # Extension loading helper
├── migration/         # V2 → V3 migration tests
├── ui/               # Options page UI tests
├── context-menu/     # Context menu tests
├── execution/        # Action execution tests
├── shortcuts/        # Keyboard shortcut tests
├── storage/          # Import/export tests
├── edge-cases/       # Error handling tests
└── smoke.spec.js     # Basic functionality tests
```

## Test Specification

See `docs/plans/testing-specification.md` for:
- Complete list of all 51 planned tests
- Test descriptions and coverage
- Implementation status tracking
- Priority levels

## Writing Tests

All tests should use the custom extension fixture:

```javascript
import { test, expect } from './fixtures/extension.js';

test('my test', async ({ optionsPage, extensionId }) => {
  // optionsPage: Pre-loaded options.html page
  // extensionId: The loaded extension's ID

  // Your test code here
});
```

## Current Status

**Smoke Tests**: ✅ 2/2 passing
- Extension loads successfully
- Options page accessible
- Default menu present

**Next Steps**: Implement Priority 1 tests from testing-specification.md
