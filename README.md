# Job Search GPT Actions - Chrome Extension

A Chrome extension that streamlines my job search workflow by quickly sending selected text to my custom Job Search ChatGPT assistant for analysis and cover letter assistance.

## Features

- **Context Menu Integration**: Right-click selected text to send it to your custom GPT
- **Keyboard Shortcuts**: Fast access with customizable keyboard shortcuts
- **Smart Tab Management**: Automatically opens or focuses your GPT tab
- **Auto-Submit**: Optionally submit prompts automatically for hands-free operation
- **Multiple Actions**: Three specialized actions for different job search needs
- **Retry Logic**: Robust injection with automatic retry on failure
- **Fresh Context**: Option to clear previous conversation context

## Actions

### 1. Fit Match (Alt+Shift+J) — *Mac: Option+Shift+J*
Analyzes how well your background fits a job description.

### 2. Job Summary (Alt+Shift+K) — *Mac: Option+Shift+K*
Creates a concise summary of a job posting.

### 3. Fit & Summary (Alt+Shift+L) — *Mac: Option+Shift+L*
Combines both fit analysis and job summary in one action.

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the extension directory

### Configuration

Before using, you must update the Custom GPT URL in `background.js`:

```javascript
const CUSTOM_GPT_URL = "https://chatgpt.com/g/YOUR-GPT-ID";
const GPT_TITLE_MATCH = "ChatGPT - Your GPT Name";
```

**Configuration Options** (background.js:1-13):
- `CUSTOM_GPT_URL`: Your custom GPT URL
- `GPT_TITLE_MATCH`: Browser tab title to match (for finding existing tabs)
- `CLEAR_CONTEXT`: Set to `true` to start fresh conversation each time
- `AUTO_SUBMIT`: Set to `true` to automatically submit prompts

## Custom GPT Configuration

To get the most out of this extension, you should create a custom ChatGPT configured specifically for job search analysis.

### Creating Your Custom GPT

1. **Navigate to ChatGPT**: Go to [chatgpt.com](https://chatgpt.com) (requires ChatGPT Plus)
2. **Create New GPT**: Click your profile → "My GPTs" → "Create a GPT"
3. **Name Your GPT**: Choose a descriptive name (e.g., "Job Search Assistant")
4. **Configure Instructions**: Add custom instructions that include:
   - Your resume or key background information
   - Your skills and experience levels
   - What you're looking for in job fit analysis
   - How you want job summaries formatted
   - Any specific criteria for evaluating opportunities

[Example: My Custom Prompt](my-custom-prompt.txt)

### Getting Your Custom GPT URL

After creating your GPT:
1. Click "Publish" to finalize your GPT
2. Copy the URL from your browser (format: `https://chatgpt.com/g/g-XXXXXXXXX-your-gpt-name`)
3. Paste this URL into the `CUSTOM_GPT_URL` constant in `background.js`
4. Update `GPT_TITLE_MATCH` to match your GPT's tab title (usually "ChatGPT - Your GPT Name")


## Usage

### Context Menu
1. Select text on any webpage (e.g., a job description)
2. Right-click the selection
3. Choose "Send to Job Search GPT" > Select an action
4. The extension will open/focus your GPT tab and insert the text

### Keyboard Shortcuts
1. Select text on any webpage
2. Press one of the keyboard shortcuts:
   - **Alt+Shift+J**: Fit Match — *Mac: Option+Shift+J*
   - **Alt+Shift+K**: Job Summary — *Mac: Option+Shift+K*
   - **Alt+Shift+L**: Fit & Summary — *Mac: Option+Shift+L*

### Customizing Shortcuts
1. Go to `chrome://extensions/shortcuts`
2. Find "Job Search GPT Actions"
3. Click the edit icon to set your preferred shortcuts

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
2. **Tab Management**: Finds existing GPT tab by title or creates new one
3. **Context Clearing**: Optionally refreshes the tab for clean context
4. **Text Injection**: Uses robust DOM querying to find ChatGPT's input field
   - Tries multiple selector strategies (background.js:130-139)
   - Handles shadow DOM traversal (background.js:153-159)
   - Validates element visibility (background.js:142-152)
5. **Auto-Submit**: Optionally clicks send button or triggers Enter key
6. **Retry Logic**: If first attempt fails, retries after 1.2 seconds
7. **Deduplication**: Prevents duplicate submissions using unique request IDs

### Key Functions

- `openOrFocusGptTab()`: Smart tab management (background.js:69-85)
- `tryInjectWithTiming()`: Main injection logic with retry (background.js:113-301)
- `pickEditor()`: Finds ChatGPT input field (background.js:167-180)
- `setValue()`: Inserts text using proper DOM APIs (background.js:202-210)
- `submit()`: Submits the prompt (background.js:226-240)

### Debounce & Race Prevention

The extension implements request deduplication at the page level (background.js:120-128):
- Each request gets a unique ID
- Page-level state tracks the last request ID and timestamp
- Duplicate requests within 10 seconds are automatically skipped

## Troubleshooting

### Extension doesn't insert text
- Check that the GPT URL and title match are correctly configured
- Ensure ChatGPT page is fully loaded before selecting text
- Try disabling auto-submit and manually clicking send

### Can't find existing GPT tab
- Verify `GPT_TITLE_MATCH` exactly matches your ChatGPT tab title
- Check browser's tab title by hovering over the tab

### Keyboard shortcuts don't work
- Ensure no other extension is using the same shortcuts
- Verify shortcuts in `chrome://extensions/shortcuts`
- Some system shortcuts may override extension shortcuts

### "Could not auto-insert text" alert
- ChatGPT may have changed their DOM structure
- Check browser console for detailed error logs
- Consider updating selector patterns in background.js:130-139

## Development

### Project Structure
```
job-search-extension-chatgpt/
├── manifest.json          # Extension configuration
├── background.js          # Main extension logic
├── background copy.js     # Backup file
└── README.md             # This file
```

### Building
No build step required - this is a pure JavaScript extension.

### Testing
1. Load extension in Chrome
2. Navigate to any webpage with text
3. Select text and test each action
4. Check console logs for debugging: `[JobSearchExt]` prefix

### Debugging
Enable verbose logging in Chrome DevTools:
1. Go to `chrome://extensions/`
2. Click "service worker" under the extension
3. View console logs for detailed execution trace

## Configuration Best Practices

### For Individual Use
- Set `CLEAR_CONTEXT = true` for independent job analyses
- Set `AUTO_SUBMIT = true` for fastest workflow
- Customize keyboard shortcuts to match your workflow

### For Multiple Jobs in Session
- Set `CLEAR_CONTEXT = false` to maintain conversation history
- Set `AUTO_SUBMIT = false` to review before sending

## Limitations

- Only works with ChatGPT (chatgpt.com and chat.openai.com)
- Requires ChatGPT Plus subscription for custom GPT access
- Hardcoded GPT URL (not configurable via UI)
- No icon or visual branding
- Fixed retry timing may not work on very slow connections

## Future Enhancements

Potential improvements for future versions:
- [ ] Options page for configuration (no code changes needed)
- [ ] Support for multiple custom GPTs
- [ ] Extension icon and branding
- [ ] Configurable retry timing
- [ ] Status notifications instead of alerts
- [ ] Export/import configuration
- [ ] Support for Claude/other AI assistants

## Version History

### 1.5.0 (Current)
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

This is a personal project. Please modify the Custom GPT URL and configuration for your own use.

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review console logs for error details
3. Verify configuration matches your setup

## Credits

Developed for streamlining job search workflows with custom ChatGPT assistants.

---

**Note**: This extension requires a ChatGPT Plus subscription and a custom GPT configured for job search assistance. Update `CUSTOM_GPT_URL` and `GPT_TITLE_MATCH` in background.js before use.
