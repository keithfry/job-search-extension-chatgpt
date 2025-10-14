// ====== CONFIG ======
const CUSTOM_GPT_URL =
  "https://chatgpt.com/g/g-68b0b1831c0c819186bcf8bc0ecef4fa-keith-fry-s-job-match-and-cover-letter-coach";
const GPT_TITLE_MATCH = "ChatGPT - Keith Fry's Job Match and Cover Letter Coach";

const CLEAR_CONTEXT = true;
const AUTO_SUBMIT = true;

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
    const tabId = await openOrFocusGptTab({ clear: CLEAR_CONTEXT });

    // unique request id for debounce across attempts
    const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Attempt #1
    const ok1 = await tryInjectWithTiming(tabId, prompt, { label: "attempt#1", autoSubmit: AUTO_SUBMIT, reqId });

    // Only do a backup if the first didn’t insert/submit
    if (!ok1) {
      setTimeout(() => tryInjectWithTiming(tabId, prompt, { label: "attempt#2", autoSubmit: AUTO_SUBMIT, reqId }), 1200);
    }
  } catch (e) {
    console.warn("[JobSearchExt] Failed to open/focus tab:", e);
    const t = await chrome.tabs.create({ url: CUSTOM_GPT_URL, active: true });
    const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setTimeout(() => tryInjectWithTiming(t.id, prompt, { label: "fallback", autoSubmit: AUTO_SUBMIT, reqId }), 1200);
  }
});

// ====== TAB/TITLE HELPERS ======
async function findExistingGptTabByTitle() {
  const candidates = await chrome.tabs.query({
    url: ["https://chatgpt.com/*", "https://chat.openai.com/*"]
  });
  return candidates.find(t => (t.title || "").toLowerCase().includes(GPT_TITLE_MATCH.toLowerCase()));
}

async function openOrFocusGptTab({ clear = false } = {}) {
  const existing = await findExistingGptTabByTitle();
  if (existing) {
    await chrome.tabs.update(existing.id, { active: true });
    if (clear) {
      const freshUrl = `${CUSTOM_GPT_URL}?fresh=${Date.now()}`;
      await chrome.tabs.update(existing.id, { url: freshUrl });
      await waitForTitleMatch(existing.id, GPT_TITLE_MATCH, 20000);
    }
    return existing.id;
  }
  const created = await chrome.tabs.create({
    url: `${CUSTOM_GPT_URL}?fresh=${Date.now()}`,
    active: true
  });
  return await waitForTitleMatch(created.id, GPT_TITLE_MATCH, 20000);
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
        url: `${CUSTOM_GPT_URL}?q=${encodeURIComponent("Could not auto-insert text. Please paste below.")}`
      });
    } catch {}
    return false;
  }
}
