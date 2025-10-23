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

  // Use e.code for physical key (Mac compatibility)
  // e.code examples: "KeyA", "Digit1", "ArrowUp", "Space"
  const code = event.code;

  // Convert code to display key (same logic as options.js)
  let displayKey;
  if (code.startsWith('Key')) {
    displayKey = code.replace('Key', ''); // "KeyY" -> "Y"
  } else if (code.startsWith('Digit')) {
    displayKey = code.replace('Digit', ''); // "Digit1" -> "1"
  } else if (code.startsWith('Arrow')) {
    displayKey = code.replace('Arrow', ''); // "ArrowUp" -> "Up"
  } else {
    displayKey = code; // Use as-is for special keys
  }

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
