// ====== CONFIG ======
const CUSTOM_GPT_URL =
  "https://chatgpt.com/g/g-68b0b1831c0c819186bcf8bc0ecef4fa-keith-fry-s-job-match-and-cover-letter-coach";
const GPT_TITLE_MATCH = "ChatGPT - Keith Fry's Job Match and Cover Letter Coach";

const ACTIONS = {
  fitMatch:      { title: "Fit Match",      prefix: "Fit Match:" },
  jobSummary:    { title: "Job Summary",    prefix: "Job Summary:" },
  fitAndSummary: { title: "Fit & Summary",  prefix: "Fit & Summary:" }
};

// ====== CONTEXT MENUS ======
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "jobSearchRoot",
    title: "Send to Job Search GPT",
    contexts: ["selection"]
  });

  Object.entries(ACTIONS).forEach(([id, def]) => {
    chrome.contextMenus.create({
      id,
      parentId: "jobSearchRoot",
      title: def.title,
      contexts: ["selection"]
    });
  });
});

// ====== MAIN CLICK HANDLER ======
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (!info.selectionText) return;

  const action = ACTIONS[info.menuItemId] || ACTIONS.jobSummary;
  const prompt = `${action.prefix} ${info.selectionText.trim()}`;

  try {
    const tabId = await openOrFocusGptTab();

    // First attempt shortly after focus (covers fast UIs)
    await tryInjectWithTiming(tabId, prompt, { label: "attempt#1" });

    // Backup attempt after a short delay (covers late hydration)
    setTimeout(() => tryInjectWithTiming(tabId, prompt, { label: "attempt#2" }), 1200);
  } catch (e) {
    console.warn("[JobSearchExt] Failed to open/focus tab:", e);
    const t = await chrome.tabs.create({ url: CUSTOM_GPT_URL, active: true });
    setTimeout(() => tryInjectWithTiming(t.id, prompt, { label: "fallback" }), 1200);
  }
});

// ====== TAB/TITLE HELPERS ======
async function findExistingGptTabByTitle() {
  const candidates = await chrome.tabs.query({
    url: ["https://chatgpt.com/*", "https://chat.openai.com/*"]
  });
  return candidates.find(t => (t.title || "").toLowerCase().includes(GPT_TITLE_MATCH.toLowerCase()));
}

async function openOrFocusGptTab() {
  const existing = await findExistingGptTabByTitle();
  if (existing) {
    await chrome.tabs.update(existing.id, { active: true });
    return existing.id;
  }
  const created = await chrome.tabs.create({ url: CUSTOM_GPT_URL, active: true });
  return await waitForTitleMatch(created.id, GPT_TITLE_MATCH, 20000); // wait up to 20s
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
        if (Date.now() - start > timeoutMs) {
          cleanup(); return reject(new Error("Timed out waiting for title match"));
        }
        setTimeout(poll, 250);
      } catch (e) {
        cleanup(); reject(e);
      }
    }

    chrome.tabs.onUpdated.addListener(onUpdated);
    poll();
  });
}

// ====== INJECTION ======
async function tryInjectWithTiming(tabId, prompt, { label = "" } = {}) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (text, label) => {
        console.log("[JobSearchExt]", label, "inject start (visible-first)");

        // Prefer real contenteditable editors, then visible textareas as fallback.
        const SELECTORS_ORDERED = [
          // contenteditable variants first
          "form div[contenteditable='true'][data-testid^='composer']",
          "form div[contenteditable='true'][role='textbox']",
          "div[contenteditable='true'][data-testid^='composer']",
          "div[contenteditable='true'][role='textbox']",

          // generic CE fallbacks
          "form [contenteditable='true']",
          "[contenteditable='true']",

          // textareas (we'll require visible)
          "form textarea",
          "textarea"
        ];

        const MAX_TRIES = 40;   // ~8s
        const INTERVAL  = 200;

        function isVisible(el) {
          if (!el || !el.ownerDocument || !el.isConnected) return false;
          const cs = getComputedStyle(el);
          if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) return false;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return false;
          // ensure no aria-hidden ancestor
          let n = el;
          while (n && n !== document.documentElement) {
            if (n.getAttribute && n.getAttribute("aria-hidden") === "true") return false;
            n = n.parentElement || n.parentNode?.host || null; // climb out of shadow roots
          }
          return true;
        }

        // Shadow-DOM aware query
        function queryDeepAll(root, sel) {
          const out = [];
          try { root.querySelectorAll(sel)?.forEach(n => out.push(n)); } catch {}
          const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
          let n;
          while ((n = tw.nextNode())) {
            if (n.shadowRoot) out.push(...queryDeepAll(n.shadowRoot, sel));
          }
          return out;
        }

        function nearestVisibleContentEditable(fromEl) {
          const form = fromEl.closest && fromEl.closest("form");
          const pool = [];
          const q = "div[contenteditable='true'][role='textbox'], div[contenteditable='true'][data-testid^='composer'], [contenteditable='true']";
          if (form) pool.push(...form.querySelectorAll(q));
          else pool.push(...document.querySelectorAll(q));
          for (const el of pool) if (isVisible(el)) return el;
          return null;
        }

        function pickEditor() {
          for (const sel of SELECTORS_ORDERED) {
            const els = queryDeepAll(document, sel);
            const visible = els.filter(isVisible);
            if (visible.length) {
              console.log("[JobSearchExt]", label, "matched visible:", sel, visible[0]);
              return visible[0];
            }
            if (els.length) {
              console.log("[JobSearchExt]", label, "matched but hidden:", sel, els[0]);
              if (els[0].tagName === "TEXTAREA") {
                const ce = nearestVisibleContentEditable(els[0]);
                if (ce) {
                  console.log("[JobSearchExt]", label, "using visible CE near hidden textarea:", ce);
                  return ce;
                }
              }
            } else {
              console.log("[JobSearchExt]", label, "not found:", sel);
            }
          }
          return null;
        }

        function insertIntoContentEditable(el, val) {
          el.focus();
          // Place caret at end
          const sel = window.getSelection && window.getSelection();
          if (sel) {
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
          // Prefer execCommand (many React CE editors listen for this)
          let ok = false;
          try {
            if (typeof document.execCommand === "function") {
              ok = document.execCommand("insertText", false, val);
            }
          } catch {}
          if (!ok) {
            el.textContent = val;
          }
          el.dispatchEvent(new InputEvent("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }

        function insertIntoTextarea(el, val) {
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
          if (el.getAttribute && el.getAttribute("contenteditable") === "true") {
            return insertIntoContentEditable(el, val);
          }
          if (el.tagName === "TEXTAREA" || "value" in el) {
            if (!isVisible(el)) {
              const ce = nearestVisibleContentEditable(el);
              if (ce) return insertIntoContentEditable(ce, val);
              // last resort: still set hidden textarea (usually ignored by app)
            }
            return insertIntoTextarea(el, val);
          }
          return false;
        }

        // Try now; if not ready, retry while the SPA hydrates
        let tries = 0;
        const attempt = () => {
          const editor = pickEditor();
          if (editor && setValue(editor, text)) {
            console.log("[JobSearchExt]", label, "inserted successfully.");
            return true;
          }
          return false;
        };

        if (attempt()) return;

        const timer = setInterval(() => {
          if (attempt()) {
            clearInterval(timer);
          } else if (++tries >= MAX_TRIES) {
            clearInterval(timer);
            console.warn("[JobSearchExt]", label, "editor not found/visible after retries — giving up.");
            alert("Could not auto-insert text. Please paste manually.");
          }
        }, INTERVAL);
      },
      args: [prompt, label]
    });
  } catch (e) {
    console.warn("[JobSearchExt] executeScript failed:", e);
    // Last resort: open with a short message (works for short prompts only)
    try {
      await chrome.tabs.update(tabId, {
        url: `${CUSTOM_GPT_URL}?q=${encodeURIComponent("Could not auto-insert text. Please paste below.")}`
      });
    } catch {}
  }
}
