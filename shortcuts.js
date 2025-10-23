// ====== STATE ======
let shortcutMap = new Map(); // "Alt+Shift+J" → "fitMatch"

// ====== SHORTCUT NORMALIZATION ======
function normalizeShortcut(event) {
  const parts = [];

  // Add modifiers in consistent order
  if (event.ctrlKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');
  if (event.metaKey) parts.push('Meta');

  // Get the key
  const key = event.key;

  // Normalize key display
  const displayKey = key.length === 1 ? key.toUpperCase() : key;
  parts.push(displayKey);

  return parts.join('+');
}

// ====== LOAD SHORTCUTS FROM BACKGROUND ======
function loadShortcuts() {
  chrome.runtime.sendMessage({ type: 'GET_SHORTCUTS' }, (response) => {
    if (response && response.shortcuts) {
      shortcutMap = new Map(response.shortcuts);
      console.log('[Shortcuts] Loaded', shortcutMap.size, 'shortcuts');
    }
  });
}

// Listen for shortcut updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SHORTCUTS_UPDATED') {
    shortcutMap = new Map(message.shortcuts);
    console.log('[Shortcuts] Updated', shortcutMap.size, 'shortcuts');
  }
});

// ====== KEYBOARD LISTENER ======
document.addEventListener('keydown', (event) => {
  // Don't interfere with input fields
  const target = event.target;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return;
  }

  const shortcut = normalizeShortcut(event);
  const actionId = shortcutMap.get(shortcut);

  if (actionId) {
    console.log('[Shortcuts] Triggered:', shortcut, '→', actionId);
    event.preventDefault();
    event.stopPropagation();

    // Send message to background to execute action
    chrome.runtime.sendMessage({
      type: 'EXECUTE_SHORTCUT',
      actionId: actionId
    });
  }
}, true); // Use capture phase to intercept early

// ====== INITIALIZATION ======
loadShortcuts();
