// ====== CONFIG VERSION ======
const CURRENT_CONFIG_VERSION = 2;

// ====== LOAD DEFAULT CONFIG ======
let DEFAULT_CONFIG = null;

async function loadDefaultConfig() {
  if (DEFAULT_CONFIG) return DEFAULT_CONFIG;

  try {
    const response = await fetch(chrome.runtime.getURL('default-config.json'));
    DEFAULT_CONFIG = await response.json();
    return DEFAULT_CONFIG;
  } catch (e) {
    console.error('[Config] Failed to load default config:', e);
    // Fallback to hardcoded minimal config
    return {
      version: CURRENT_CONFIG_VERSION,
      globalSettings: {
        customGptUrl: "https://chatgpt.com/g/g-<<YOUR CUSTOM GPT URL>>",
        gptTitleMatch: "ChatGPT",
        contextMenuTitle: "Send to ChatGPT",
        clearContext: true,
        autoSubmit: true,
        runAllEnabled: false,
        runAllShortcut: ""
      },
      actions: []
    };
  }
}

// ====== CONFIG MIGRATION ======
function migrateConfigVersion(config) {
  // If no version, assume version 1 (old format before versioning)
  const configVersion = config.version || 1;

  // Already at current version, no migration needed
  if (configVersion === CURRENT_CONFIG_VERSION) {
    return config;
  }

  console.log(`[Config] Migrating from v${configVersion} to v${CURRENT_CONFIG_VERSION}`);

  let migratedConfig = { ...config };

  // Migration from v1 to v2
  if (configVersion < 2) {
    migratedConfig.version = 2;
    // v1 had no version field, v2 adds it at root level
    // Structure is otherwise compatible
  }

  // Future migrations will go here:
  // if (configVersion < 3) { ... }
  // if (configVersion < 4) { ... }

  console.log(`[Config] Migration complete to v${CURRENT_CONFIG_VERSION}`);
  return migratedConfig;
}

// ====== VALIDATION ======
function validateConfig(config) {
  const errors = [];

  // Validate structure
  if (!config || typeof config !== 'object') {
    return ['Configuration must be an object'];
  }

  // Log version (warn if missing, but don't fail validation)
  const configVersion = config.version || 1;
  console.log(`[Config] Validating config v${configVersion}`);

  // Global settings validation
  if (!config.globalSettings) {
    errors.push('Missing globalSettings');
  } else {
    if (!config.globalSettings.customGptUrl?.startsWith('https://chatgpt.com/')) {
      errors.push('Custom GPT URL must start with https://chatgpt.com/');
    }
    if (!config.globalSettings.gptTitleMatch?.trim()) {
      errors.push('GPT Title Match is required');
    }
    if (!config.globalSettings.contextMenuTitle?.trim()) {
      errors.push('Context Menu Title is required');
    }
    if (typeof config.globalSettings.clearContext !== 'boolean') {
      errors.push('clearContext must be true or false');
    }
    if (typeof config.globalSettings.autoSubmit !== 'boolean') {
      errors.push('autoSubmit must be true or false');
    }
  }

  // Actions validation
  if (!Array.isArray(config.actions)) {
    errors.push('actions must be an array');
  } else if (config.actions.length > 0) {
    // Only validate individual actions if there are any
    config.actions.forEach((action, index) => {
      if (!action.id || !/^[a-zA-Z0-9_-]+$/.test(action.id)) {
        errors.push(`Action ${index + 1}: Invalid ID format (alphanumeric, dash, underscore only)`);
      }
      if (!action.title?.trim()) {
        errors.push(`Action ${index + 1}: Title is required`);
      }
      if (!action.prompt?.trim()) {
        errors.push(`Action ${index + 1}: Prompt is required`);
      }
      if (action.shortcut && action.shortcut.trim()) {
        const validShortcutPattern = /^(Ctrl|Alt|Shift|Meta)(\+(Ctrl|Alt|Shift|Meta))*\+.+$/;
        if (!validShortcutPattern.test(action.shortcut)) {
          errors.push(`Action ${index + 1}: Invalid shortcut format (must include modifier keys)`);
        }
      }
      if (typeof action.enabled !== 'boolean') {
        errors.push(`Action ${index + 1}: enabled must be true or false`);
      }
      if (typeof action.order !== 'number') {
        errors.push(`Action ${index + 1}: order must be a number`);
      }
    });

    // Check for duplicate IDs
    const ids = config.actions.map(a => a.id);
    const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (duplicateIds.length) {
      errors.push(`Duplicate action IDs: ${[...new Set(duplicateIds)].join(', ')}`);
    }

    // Check for duplicate shortcuts (among enabled actions only)
    const enabledShortcuts = config.actions
      .filter(a => a.enabled && a.shortcut?.trim())
      .map(a => a.shortcut);
    const duplicateShortcuts = enabledShortcuts.filter((s, i) => enabledShortcuts.indexOf(s) !== i);
    if (duplicateShortcuts.length) {
      errors.push(`Duplicate shortcuts: ${[...new Set(duplicateShortcuts)].join(', ')}`);
    }
  }

  return errors;
}

// ====== GET CONFIGURATION ======
async function getConfig() {
  try {
    const { config } = await chrome.storage.sync.get('config');
    const defaultConfig = await loadDefaultConfig();

    if (!config) {
      console.log('[Config] No config found, using defaults');
      return JSON.parse(JSON.stringify(defaultConfig));
    }

    // Migrate config if needed
    const originalVersion = config.version || 1;
    const migratedConfig = migrateConfigVersion(config);

    // If migration happened, save the migrated config
    if (originalVersion !== CURRENT_CONFIG_VERSION) {
      console.log('[Config] Saving migrated config');
      await chrome.storage.sync.set({ config: migratedConfig });
    }

    // Validate migrated config
    const errors = validateConfig(migratedConfig);
    if (errors.length > 0) {
      console.error('[Config] Validation failed, using defaults:', errors);
      return JSON.parse(JSON.stringify(defaultConfig));
    }

    return migratedConfig;
  } catch (e) {
    console.error('[Config] Error loading config, using defaults:', e);
    const defaultConfig = await loadDefaultConfig();
    return JSON.parse(JSON.stringify(defaultConfig));
  }
}

// ====== SAVE CONFIGURATION ======
async function saveConfig(config) {
  // Validate before saving
  const errors = validateConfig(config);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join('; ')}`);
  }

  // Save to storage
  await chrome.storage.sync.set({ config });
  console.log('[Config] Saved successfully');
}

// ====== MIGRATION ======
async function migrateConfig() {
  const { config } = await chrome.storage.sync.get('config');

  // Already has new config format
  if (config) {
    console.log('[Config] Already migrated');
    return;
  }

  // First time running v2.0.0 - create default config
  console.log('[Config] Migrating to v2.0.0...');
  const defaultConfig = await loadDefaultConfig();
  await chrome.storage.sync.set({ config: defaultConfig });
  console.log('[Config] Migration complete');
}

// ====== EXPORTS ======
export { validateConfig, getConfig, saveConfig, migrateConfig };
