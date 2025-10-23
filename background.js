import { getConfig, migrateConfig } from './config.js';

// ====== DYNAMIC CONFIG ======
// Config is now loaded from chrome.storage.sync
// No hardcoded values - everything is user-configurable

// ====== CONFIG CACHE ======
let cachedConfig = null;

async function loadConfig() {
  if (!cachedConfig) {
    cachedConfig = await getConfig();
  }
  return cachedConfig;
}

function invalidateCache() {
  cachedConfig = null;
}

// ====== INSTALLATION & MIGRATION ======
chrome.runtime.onInstalled.addListener(async () => {
  // Migrate config if needed (v1.6.0 → v2.0.0)
  await migrateConfig();

  // Load config and build menus
  await rebuildContextMenus();
});

// ====== CONTEXT MENU MANAGEMENT ======
let isRebuildingMenus = false;

async function rebuildContextMenus() {
  // Prevent concurrent rebuilds
  if (isRebuildingMenus) {
    console.log('[Background] Menu rebuild already in progress, skipping');
    return;
  }

  isRebuildingMenus = true;

  try {
    // Clear all existing menus
    await chrome.contextMenus.removeAll();

    // Small delay to ensure removal completes
    await new Promise(resolve => setTimeout(resolve, 50));

    // Load current config
    const config = await loadConfig();

    // Helper to create menu item with error handling
    const createMenuItem = (props) => {
      try {
        chrome.contextMenus.create(props);
      } catch (e) {
        if (!e.message?.includes('duplicate')) {
          console.error('[Background] Error creating menu item:', props.id, e);
        }
      }
    };

    // Create root menu
    createMenuItem({
      id: 'jobSearchRoot',
      title: config.globalSettings.contextMenuTitle,
      contexts: ['selection']
    });

    // Create menu item for each enabled action
    const enabledActions = config.actions
      .filter(action => action.enabled)
      .sort((a, b) => a.order - b.order);

    enabledActions.forEach(action => {
      createMenuItem({
        id: action.id,
        parentId: 'jobSearchRoot',
        title: action.title,
        contexts: ['selection']
      });
    });

    // Create "Run All" menu item if enabled and there are multiple actions
    if (config.globalSettings.runAllEnabled && enabledActions.length > 1) {
      createMenuItem({
        id: 'runAll',
        parentId: 'jobSearchRoot',
        title: 'Run All Actions',
        contexts: ['selection']
      });
    }

    console.log('[Background] Context menus rebuilt:', enabledActions.length, 'actions');
  } catch (e) {
    console.error('[Background] Error rebuilding context menus:', e);
  } finally {
    isRebuildingMenus = false;
  }
}

// ====== SHORTCUT MAP BUILDER ======
function buildShortcutMap(config) {
  const map = new Map();

  // Add individual action shortcuts
  config.actions
    .filter(action => action.enabled && action.shortcut)
    .forEach(action => {
      map.set(action.shortcut, action.id);
    });

  // Add Run All shortcut if enabled and configured
  if (config.globalSettings.runAllEnabled && config.globalSettings.runAllShortcut) {
    map.set(config.globalSettings.runAllShortcut, 'runAll');
  }

  return map;
}

// ====== STORAGE CHANGE LISTENER ======
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === 'sync' && changes.config) {
    console.log('[Background] Config changed, rebuilding...');
    invalidateCache();
    await rebuildContextMenus();

    // Notify all tabs to reload shortcuts
    const tabs = await chrome.tabs.query({});
    const config = await loadConfig();
    const shortcuts = buildShortcutMap(config);

    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'SHORTCUTS_UPDATED',
        shortcuts: Array.from(shortcuts.entries())
      }).catch(() => {
        // Ignore errors for tabs where content script isn't loaded
      });
    });
  }
});

// ====== CONTEXT MENU CLICK HANDLER ======
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (!info.selectionText) return;

  const config = await loadConfig();
  const actionId = info.menuItemId;

  // Handle "Run All" action
  if (actionId === 'runAll') {
    await runAllActions(info.selectionText.trim(), config);
    return;
  }

  // Find the action
  const action = config.actions.find(a => a.id === actionId);
  if (!action) {
    console.warn('[Background] Action not found:', actionId);
    return;
  }

  // Execute single action
  await executeAction(action, info.selectionText.trim(), config);
});

// ====== SINGLE ACTION EXECUTION ======
async function executeAction(action, selectionText, config) {
  const prompt = `${action.prompt} ${selectionText}`;

  try {
    const tabId = await openOrFocusGptTab(config, { clear: config.globalSettings.clearContext });

    const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Attempt #1
    const ok1 = await tryInjectWithTiming(tabId, prompt, {
      label: `${action.id}-attempt#1`,
      autoSubmit: config.globalSettings.autoSubmit,
      reqId
    });

    // Retry if needed
    if (!ok1) {
      setTimeout(() => tryInjectWithTiming(tabId, prompt, {
        label: `${action.id}-attempt#2`,
        autoSubmit: config.globalSettings.autoSubmit,
        reqId
      }), 1200);
    }
  } catch (e) {
    console.warn('[Background] Failed to execute action:', action.id, e);
    const t = await chrome.tabs.create({ url: config.globalSettings.customGptUrl, active: true });
    const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setTimeout(() => tryInjectWithTiming(t.id, prompt, {
      label: `${action.id}-fallback`,
      autoSubmit: config.globalSettings.autoSubmit,
      reqId
    }), 1200);
  }
}

// ====== RUN ALL ACTIONS HANDLER ======
async function runAllActions(selectionText, config) {
  // Get all enabled actions
  const enabledActions = config.actions
    .filter(action => action.enabled)
    .sort((a, b) => a.order - b.order);

  console.log(`[Background] Run All: Found ${enabledActions.length} enabled actions:`, enabledActions.map(a => a.title));

  // Step 1: Create all tabs immediately IN ORDER, then wait for them to load IN PARALLEL
  const tabCreationPromises = enabledActions.map(async (action) => {
    try {
      const tab = await chrome.tabs.create({
        url: config.globalSettings.customGptUrl,
        active: false
      });
      const tabId = await waitForTitleMatch(tab.id, config.globalSettings.gptTitleMatch, 20000);
      console.log(`[Background] Created tab ${tabId} for ${action.title}`);
      return { action, tabId };
    } catch (e) {
      console.warn(`[Background] Failed to create tab for ${action.title}:`, e);
      return null;
    }
  });

  const results = await Promise.all(tabCreationPromises);
  const tabData = results.filter(r => r !== null);

  // Step 2: Inject prompts into all tabs IN PARALLEL
  const promises = tabData.map(async ({ action, tabId }) => {
    const prompt = `${action.prompt} ${selectionText}`;

    try {
      console.log(`[Background] Injecting prompt for ${action.title} in tab ${tabId}`);

      const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Attempt #1
      const ok1 = await tryInjectWithTiming(tabId, prompt, {
        label: `runAll-${action.id}-attempt#1`,
        autoSubmit: config.globalSettings.autoSubmit,
        reqId
      });

      // Retry if needed
      if (!ok1) {
        setTimeout(() => tryInjectWithTiming(tabId, prompt, {
          label: `runAll-${action.id}-attempt#2`,
          autoSubmit: config.globalSettings.autoSubmit,
          reqId
        }), 1200);
      }
    } catch (e) {
      console.warn(`[Background] Failed to inject prompt for ${action.title}:`, e);
    }
  });

  await Promise.all(promises);
  console.log('[Background] All actions launched');
}

// ====== TAB/TITLE HELPERS ======
async function openOrFocusGptTab(config, { clear = false } = {}) {
  const created = await chrome.tabs.create({
    url: `${config.globalSettings.customGptUrl}?fresh=${Date.now()}`,
    active: true
  });
  return await waitForTitleMatch(created.id, config.globalSettings.gptTitleMatch, 20000);
}

function waitForTitleMatch(tabId, titleSubstring, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function done(id) { cleanup(); resolve(id); }
    function cleanup() { chrome.tabs.onUpdated.removeListener(onUpdated); }
    function onUpdated(id, info, tab) {
      if (id !== tabId || !info.title) return;
      const ok = (tab.title || "").toLowerCase().includes(titleSubstring.toLowerCase());
      if (ok) return done(tabId);
    }
    async function poll() {
      try {
        const t = await chrome.tabs.get(tabId);
        if (!t) return reject(new Error("Tab closed"));
        const ok = (t.title || "").toLowerCase().includes(titleSubstring.toLowerCase());
        if (ok) return done(tabId);
        if (Date.now() - start > timeoutMs) { cleanup(); return reject(new Error("Timed out waiting for title match")); }
        setTimeout(poll, 250);
      } catch (e) { cleanup(); reject(e); }
    }
    chrome.tabs.onUpdated.addListener(onUpdated);
    poll();
  });
}

// ====== INJECTION (returns true if inserted/submitted, else false) ======
async function tryInjectWithTiming(tabId, prompt, { label = "", autoSubmit = false, reqId = "" } = {}) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: (text, label, shouldSubmit, requestId) => {
        console.log("[JobSearchExt]", label, "inject start (debounced)", { requestId, shouldSubmit });

        // ---- page-level debounce: if same reqId already handled in last 10s, skip ----
        const now = Date.now();
        const DEBOUNCE_MS = 10_000;
        const g = (window.__JSE_STATE ||= {});
        if (g.lastReqId === requestId && now - (g.lastReqAt || 0) < DEBOUNCE_MS) {
          console.log("[JobSearchExt]", label, "debounced duplicate requestId");
          return { inserted: false, submitted: false, skipped: true };
        }
        g.lastReqId = requestId; g.lastReqAt = now;

        const SELECTORS_ORDERED = [
          "form div[contenteditable='true'][data-testid^='composer']",
          "form div[contenteditable='true'][role='textbox']",
          "div[contenteditable='true'][data-testid^='composer']",
          "div[contenteditable='true'][role='textbox']",
          "form [contenteditable='true']",
          "[contenteditable='true']",
          "form textarea",
          "textarea"
        ];
        const MAX_TRIES = 40, INTERVAL = 200;

        function isVisible(el) {
          if (!el || !el.ownerDocument || !el.isConnected) return false;
          const cs = getComputedStyle(el);
          if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) return false;
          const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) return false;
          let n = el; while (n && n !== document.documentElement) {
            if (n.getAttribute && n.getAttribute("aria-hidden") === "true") return false;
            n = n.parentElement || n.parentNode?.host || null;
          }
          return true;
        }
        function queryDeepAll(root, sel) {
          const out = [];
          try { root.querySelectorAll(sel)?.forEach(n => out.push(n)); } catch {}
          const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
          let n; while ((n = tw.nextNode())) if (n.shadowRoot) out.push(...queryDeepAll(n.shadowRoot, sel));
          return out;
        }
        function nearestVisibleCE(fromEl) {
          const form = fromEl.closest && fromEl.closest("form");
          const q = "div[contenteditable='true'][role='textbox'], div[contenteditable='true'][data-testid^='composer'], [contenteditable='true']";
          const pool = form ? form.querySelectorAll(q) : document.querySelectorAll(q);
          for (const el of pool) if (isVisible(el)) return el;
          return null;
        }
        function pickEditor() {
          for (const sel of SELECTORS_ORDERED) {
            const els = queryDeepAll(document, sel);
            const vis = els.filter(isVisible);
            if (vis.length) { console.log("[JobSearchExt]", label, "matched visible:", sel, vis[0]); return vis[0]; }
            if (els.length) {
              console.log("[JobSearchExt]", label, "matched but hidden:", sel, els[0]);
              if (els[0].tagName === "TEXTAREA") {
                const ce = nearestVisibleCE(els[0]); if (ce) return ce;
              }
            } else { console.log("[JobSearchExt]", label, "not found:", sel); }
          }
          return null;
        }
        function insertIntoCE(el, val) {
          el.focus();
          const sel = window.getSelection && window.getSelection();
          if (sel) { const range = document.createRange(); range.selectNodeContents(el); range.collapse(false); sel.removeAllRanges(); sel.addRange(range); }
          let ok = false;
          try { if (typeof document.execCommand === "function") ok = document.execCommand("insertText", false, val); } catch {}
          if (!ok) el.textContent = val;
          el.dispatchEvent(new InputEvent("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }
        function insertIntoTA(el, val) {
          el.focus();
          const setter =
            Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set ||
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
          if (setter) setter.call(el, val); else el.value = val;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }
        function setValue(el, val) {
          if (!el) return false;
          if (el.getAttribute && el.getAttribute("contenteditable") === "true") return insertIntoCE(el, val);
          if (el.tagName === "TEXTAREA" || "value" in el) {
            if (!isVisible(el)) { const ce = nearestVisibleCE(el); if (ce) return insertIntoCE(ce, val); }
            return insertIntoTA(el, val);
          }
          return false;
        }
        function findSendButton() {
          const sels = [
            "form button[data-testid='send-button']",
            "button[data-testid='send-button']",
            "form button[aria-label*='send' i]",
            "button[aria-label*='send' i]",
            "form button[type='submit']",
            "button[type='submit']"
          ];
          for (const s of sels) {
            const c = queryDeepAll(document, s).filter(isVisible);
            if (c.length) { console.log("[JobSearchExt]", label, "send button via", s, c[0]); return c[0]; }
          }
          return null;
        }
        function submit(editorEl) {
          const btn = findSendButton();
          if (btn) {
            let tries = 0; const max = 10;
            const tick = () => {
              const cs = getComputedStyle(btn);
              const disabled = btn.disabled || cs.pointerEvents === "none" || cs.opacity === "0.5";
              if (!disabled) { btn.click(); console.log("[JobSearchExt]", label, "clicked send button"); return true; }
              if (++tries >= max) { console.log("[JobSearchExt]", label, "send disabled; fallback Enter"); return enter(editorEl); }
              setTimeout(tick, 200);
            };
            tick(); return true;
          }
          return enter(editorEl);
        }
        function enter(editorEl) {
          try {
            editorEl.focus();
            const opts = { bubbles: true, cancelable: true, key: "Enter", code: "Enter", keyCode: 13, which: 13 };
            editorEl.dispatchEvent(new KeyboardEvent("keydown", opts));
            editorEl.dispatchEvent(new KeyboardEvent("keyup", opts));
            console.log("[JobSearchExt]", label, "sent Enter");
            return true;
          } catch {
            const form = editorEl.closest && editorEl.closest("form");
            if (form?.requestSubmit) { form.requestSubmit(); console.log("[JobSearchExt]", label, "form.requestSubmit()"); return true; }
          }
          return false;
        }

        // Attempt insert (+ optional submit) with short retries
        let tries = 0;
        const MAX_TRIES_LOCAL = MAX_TRIES;
        const tryOnce = () => {
          const editor = pickEditor();
          if (editor && setValue(editor, text)) {
            console.log("[JobSearchExt]", label, "inserted");
            if (shouldSubmit) setTimeout(() => submit(editor), 150);
            return { inserted: true, submitted: !!shouldSubmit, skipped: false };
          }
          return null;
        };
        const immediate = tryOnce();
        if (immediate) return immediate;

        return new Promise((resolve) => {
          const timer = setInterval(() => {
            const r = tryOnce();
            if (r) { clearInterval(timer); resolve(r); }
            else if (++tries >= MAX_TRIES_LOCAL) {
              clearInterval(timer);
              console.warn("[JobSearchExt]", label, "editor not found — giving up");
              alert("Could not auto-insert text. Please paste manually.");
              resolve({ inserted: false, submitted: false, skipped: false });
            }
          }, INTERVAL);
        });
      },
      args: [prompt, label, autoSubmit, reqId],
      world: "MAIN" // ensure we're in the page's main world
    });

    // Normalize return (MV3 returns array of {result})
    const res = Array.isArray(results) && results[0] && results[0].result;
    const ok = !!(res && (res.inserted || res.submitted) && !res.skipped);
    return ok;
  } catch (e) {
    console.warn("[JobSearchExt] executeScript failed:", e);
    try {
      await chrome.tabs.update(tabId, {
        url: `https://chatgpt.com/?q=${encodeURIComponent("Could not auto-insert text. Please paste below.")}`
      });
    } catch {}
    return false;
  }
}

// ====== MESSAGE LISTENER FOR SHORTCUTS ======
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SHORTCUTS') {
    // Content script requesting current shortcuts
    loadConfig().then(config => {
      const shortcuts = buildShortcutMap(config);
      sendResponse({ shortcuts: Array.from(shortcuts.entries()) });
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'EXECUTE_SHORTCUT') {
    // Content script triggered a shortcut
    if (message.selectionText) {
      handleShortcutExecution(message.actionId, message.selectionText);
    } else {
      console.error('[Background] No selection text in shortcut message');
    }
    return false;
  }
});

// ====== SHORTCUT EXECUTION HANDLER ======
async function handleShortcutExecution(actionId, selectionText) {
  try {
    const config = await loadConfig();

    // Handle "Run All" shortcut
    if (actionId === 'runAll') {
      await runAllActions(selectionText, config);
      return;
    }

    // Find the action
    const action = config.actions.find(a => a.id === actionId);
    if (!action) {
      console.warn('[Background] Action not found for shortcut:', actionId);
      return;
    }

    // Execute the action
    await executeAction(action, selectionText, config);
  } catch (e) {
    console.error('[Background] Failed to handle shortcut execution:', e);
  }
}
