# ChatGPT Custom Prompts - Chrome Extension

A Chrome extension that allows you to send selected text to your custom ChatGPT assistant with configurable custom prompts, shortcuts, and settings.

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

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the extension directory

### Configuration

**v2.0.0 and later:** All configuration is done through the options page (chrome://extensions → Details → Extension options).

**Configuration Options:**
- **Custom GPT URL**: Your custom GPT URL (e.g., https://chatgpt.com/g/g-...)
- **Context Menu Title**: Customize the right-click menu title
- **Auto Submit**: Set to enable/disable automatically submitting prompts
- **Enable Run All Actions**: Show/hide the "Run All" feature with configurable shortcut
- **Actions**: Add, edit, remove, and reorder actions with custom prompts and shortcuts

**For v1.6.0 and earlier users:** Your existing configuration will be automatically migrated to the new options page on first load.

## Custom GPT Configuration

To get the most out of this extension, you should create a custom ChatGPT configured for your specific use case.

### Creating Your Custom GPT

1. **Navigate to ChatGPT**: Go to [chatgpt.com](https://chatgpt.com) (requires ChatGPT Plus)
2. **Create New GPT**: Click your profile → "My GPTs" → "Create a GPT"
3. **Name Your GPT**: Choose a descriptive name for your assistant
4. **Configure Instructions**: Add custom instructions tailored to your needs

### Getting Your Custom GPT URL

After creating your GPT:
1. Click "Publish" to finalize your GPT
2. Copy the URL from your browser (format: `https://chatgpt.com/g/g-XXXXXXXXX-your-gpt-name`)
3. Open the extension's options page (chrome://extensions → Details → Extension options)
4. Paste the URL into the "Custom GPT URL" field
5. Customize the "Context Menu Title" if desired
6. Click "Save"


## Usage

### Context Menu
1. Select text on any webpage
2. Right-click the selection
3. Choose your configured action from the context menu
4. The extension will open/focus your GPT tab and insert the text

### Keyboard Shortcuts
1. Select text on any webpage
2. Press your configured keyboard shortcut

### Customizing Shortcuts

**v2.0.0 and later:**
1. Go to Extension options (chrome://extensions → Details → Extension options)
2. Click the keyboard icon (⌨️) next to any action
3. Press your desired key combination
4. Click "Save"

**v1.6.0 and earlier:**
1. Go to `chrome://extensions/shortcuts`
2. Find "ChatGPT Custom Prompts"
3. Click the edit icon to set your preferred shortcuts

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

## Technical Details

### Architecture
- **Manifest Version**: 3 (latest Chrome extension standard)
- **Service Worker**: background.js handles all logic
- **Content Script Injection**: Dynamic script injection for ChatGPT interaction
- **Permissions**: Minimal required permissions for security

### Permissions
- `contextMenus`: For right-click menu integration
- `tabs`: For tab management
- `scripting`: For injecting content into ChatGPT pages
- `activeTab`: For reading selected text

### Host Permissions
- `https://chatgpt.com/*`
- `https://chat.openai.com/*`

### How It Works

1. **Selection Capture**: When triggered, captures selected text from current tab
2. **Tab Management**:
   - Single actions: Creates new GPT tab for each action
   - Run All: Creates separate tabs for all enabled actions in parallel
3. **Context Clearing**: Always starts with fresh context for clean analysis
4. **Text Injection**: Uses robust DOM querying to find ChatGPT's input field
   - Tries multiple selector strategies
   - Handles shadow DOM traversal
   - Validates element visibility
5. **Auto-Submit**: Optionally clicks send button or triggers Enter key
6. **Retry Logic**: If first attempt fails, retries after 1.2 seconds
7. **Deduplication**: Prevents duplicate submissions using unique request IDs
8. **Parallel Execution**: Run All launches all actions simultaneously in background tabs

### Key Functions

- `runAllActions()`: Launches all enabled actions in parallel tabs (order preserved)
- `executeAction()`: Executes a single action with selected text
- `handleShortcutExecution()`: Processes keyboard shortcut triggers
- `rebuildContextMenus()`: Dynamically creates context menus from config
- `tryInjectWithTiming()`: Main injection logic with retry
- `pickEditor()`: Finds ChatGPT input field
- `setValue()`: Inserts text using proper DOM APIs
- `submit()`: Submits the prompt

### Debounce & Race Prevention

The extension implements request deduplication at the page level:
- Each request gets a unique ID
- Page-level state tracks the last request ID and timestamp
- Duplicate requests within 10 seconds are automatically skipped
- Run All creates separate request IDs for each parallel action

## Troubleshooting

### Extension doesn't insert text
- Check that the GPT URL and title match are correctly configured
- Ensure ChatGPT page is fully loaded before selecting text
- Try disabling auto-submit and manually clicking send

### Tabs not opening correctly
- Verify the Custom GPT URL is correct in extension options
- Check browser's tab title by hovering over the tab
- Ensure ChatGPT is accessible and you're logged in

### Keyboard shortcuts don't work
- Ensure no other extension is using the same shortcuts
- Configure shortcuts in the extension options page
- After reloading the extension, refresh any open pages to reload the content script
- Some system shortcuts may override extension shortcuts

### "Could not auto-insert text" alert
- ChatGPT may have changed their DOM structure
- Check browser console for detailed error logs
- Consider updating selector patterns in background.js:130-139

## Development

### Project Structure
```
chatgpt-query-extension/
├── manifest.json          # Extension configuration (Manifest V3)
├── background.js          # Service worker - main extension logic
├── config.js              # Configuration module with defaults and validation
├── options.html           # Options page UI
├── options.css            # Options page styling
├── options.js             # Options page logic
├── shortcuts.js           # Content script for keyboard shortcuts
└── README.md              # This file
```

### Building
No build step required - this is a pure JavaScript extension.

### Testing
1. Load extension in Chrome
2. Navigate to any webpage with text
3. Select text and test each action
4. Check console logs for debugging

### Debugging
Enable verbose logging in Chrome DevTools:
1. Go to `chrome://extensions/`
2. Click "service worker" under the extension
3. View console logs for detailed execution trace

## Configuration Best Practices

### For Fast Workflow
- Enable `Auto Submit` for hands-free operation
- Customize keyboard shortcuts to match your muscle memory
- Use "Run All Actions" when you need comprehensive analysis

### Managing Actions
- Disable actions you don't use frequently to keep menus clean
- Reorder actions to put most-used ones at the top
- Export your configuration regularly as backup

## Limitations

- Only works with ChatGPT (chatgpt.com and chat.openai.com)
- Requires ChatGPT Plus subscription for custom GPT access
- ~~Hardcoded GPT URL~~ **Now configurable via options page!**
- No icon or visual branding
- Fixed retry timing may not work on very slow connections

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
- Support for other browsers

## Version History

### 2.0.0 (Current) - **Major Update: Fully Configurable**
- **Options Page**: Full configuration UI for all settings
- **Custom Actions**: Add, edit, remove, and reorder actions
- **Custom Shortcuts**: Assign any keyboard shortcut to any action with Mac compatibility
- **Configurable Context Menu Title**: Customize the right-click menu text
- **Enable/Disable Run All**: Optional "Run All Actions" feature with custom shortcut
- **Import/Export**: Backup and share configurations via JSON
- **Dynamic Menus**: Context menus rebuild automatically from config
- **Parallel Tab Creation**: Run All creates all tabs quickly while preserving order
- **Keyboard Shortcut Content Script**: Page-level shortcut handling for all URLs
- **Migration**: Automatic migration from v1.6.0 hardcoded config
- **Breaking Change**: Config now stored in chrome.storage.sync (not code)

### 1.6.0
- **Run All Actions**: Execute all three actions in parallel tabs
- Keyboard shortcut (Alt+Shift+H) for Run All
- Context menu option for Run All
- Parallel tab management for simultaneous processing

### 1.5.0
- Keyboard shortcut support for all actions
- Enhanced deduplication logic
- Shadow DOM traversal support
- Improved visibility checking
- Better error handling

### Previous Versions
- Context menu integration
- Auto-submit functionality
- Retry logic
- Tab management

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**TL;DR**: You are free to use, modify, and distribute this code for any purpose, including commercial use. The software is provided "as is" without warranty of any kind.

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review console logs for error details
3. Verify configuration matches your setup

## Credits

A flexible Chrome extension for sending selected text to custom ChatGPT assistants.

---

**Note**: This extension requires a ChatGPT Plus subscription and a custom GPT. Configure your Custom GPT URL via the extension's options page.
