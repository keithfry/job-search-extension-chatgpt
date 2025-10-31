// ====== CONFIG VERSION ======
const CURRENT_CONFIG_VERSION = 3;

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
    // Fallback to hardcoded minimal config (V3 format)
    return {
      version: CURRENT_CONFIG_VERSION,
      menus: [
        {
          id: `menu_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: "Send to ChatGPT",
          customGptUrl: "https://chatgpt.com/g/g-<<YOUR CUSTOM GPT URL>>",
          autoSubmit: true,
          runAllEnabled: false,
          runAllShortcut: "",
          order: 1,
          actions: []
        }
      ],
      globalSettings: {
        gptTitleMatch: "ChatGPT",
        clearContext: true
      }
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

  // Migration from v2 to v3
  if (configVersion < 3) {
    migratedConfig = migrateV2toV3(migratedConfig);
  }

  // Future migrations will go here:
  // if (configVersion < 4) { ... }

  console.log(`[Config] Migration complete to v${CURRENT_CONFIG_VERSION}`);
  return migratedConfig;
}

// ====== V2 TO V3 MIGRATION ======
function migrateV2toV3(v2Config) {
  console.log('[Config] Migrating V2 → V3: Converting single menu to multi-menu format');

  // Generate unique ID for the menu
  const menuId = `menu_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Extract V2 global settings
  const v2Global = v2Config.globalSettings || {};
  const v2Actions = v2Config.actions || [];

  // Create single menu from V2 data
  const menu = {
    id: menuId,
    name: v2Global.contextMenuTitle || "Send to ChatGPT",
    customGptUrl: v2Global.customGptUrl || "https://chatgpt.com/g/g-<<YOUR CUSTOM GPT URL>>",
    autoSubmit: v2Global.autoSubmit !== false, // Default true
    runAllEnabled: v2Global.runAllEnabled || false,
    runAllShortcut: v2Global.runAllShortcut || "",
    order: 1,
    actions: v2Actions
  };

  // Create V3 config
  const v3Config = {
    version: 3,
    menus: [menu],
    globalSettings: {
      gptTitleMatch: v2Global.gptTitleMatch || "ChatGPT",
      clearContext: v2Global.clearContext !== false // Default true
    }
  };

  console.log(`[Config] V2 → V3 migration complete: Created menu "${menu.name}" with ${v2Actions.length} actions`);
  return v3Config;
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

  // V3 validation (multi-menu format)
  if (configVersion >= 3) {
    return validateV3Config(config);
  }

  // V2 validation (legacy single-menu format)
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

// ====== V3 VALIDATION ======
function validateV3Config(config) {
  const errors = [];

  // Validate menus array
  if (!Array.isArray(config.menus)) {
    errors.push('menus must be an array');
    return errors;
  }

  if (config.menus.length > 10) {
    errors.push('Maximum 10 menus allowed');
  }

  // Validate global settings
  if (!config.globalSettings) {
    errors.push('Missing globalSettings');
  } else {
    if (!config.globalSettings.gptTitleMatch?.trim()) {
      errors.push('GPT Title Match is required');
    }
    if (typeof config.globalSettings.clearContext !== 'boolean') {
      errors.push('clearContext must be true or false');
    }
  }

  // Track all shortcuts across all menus for duplicate detection
  const allShortcuts = [];
  const allMenuIds = [];

  // Validate each menu
  config.menus.forEach((menu, menuIndex) => {
    const menuLabel = `Menu ${menuIndex + 1}`;

    // Menu ID validation
    if (!menu.id || typeof menu.id !== 'string') {
      errors.push(`${menuLabel}: Menu ID is required`);
    } else {
      if (allMenuIds.includes(menu.id)) {
        errors.push(`${menuLabel}: Duplicate menu ID "${menu.id}"`);
      }
      allMenuIds.push(menu.id);
    }

    // Menu name validation
    if (!menu.name?.trim()) {
      errors.push(`${menuLabel}: Menu name is required`);
    } else if (menu.name.length > 50) {
      errors.push(`${menuLabel}: Menu name must be 50 characters or less`);
    }

    // Custom GPT URL validation
    if (!menu.customGptUrl?.startsWith('https://chatgpt.com/')) {
      errors.push(`${menuLabel}: Custom GPT URL must start with https://chatgpt.com/`);
    }

    // Boolean validations
    if (typeof menu.autoSubmit !== 'boolean') {
      errors.push(`${menuLabel}: autoSubmit must be true or false`);
    }
    if (typeof menu.runAllEnabled !== 'boolean') {
      errors.push(`${menuLabel}: runAllEnabled must be true or false`);
    }

    // Order validation
    if (typeof menu.order !== 'number') {
      errors.push(`${menuLabel}: order must be a number`);
    }

    // Run All shortcut validation (if enabled and configured)
    if (menu.runAllEnabled && menu.runAllShortcut?.trim()) {
      const validShortcutPattern = /^(Ctrl|Alt|Shift|Meta)(\+(Ctrl|Alt|Shift|Meta))*\+.+$/;
      if (!validShortcutPattern.test(menu.runAllShortcut)) {
        errors.push(`${menuLabel}: Invalid Run All shortcut format (must include modifier keys)`);
      } else {
        allShortcuts.push({ shortcut: menu.runAllShortcut, source: `${menu.name} - Run All` });
      }
    }

    // Actions validation
    if (!Array.isArray(menu.actions)) {
      errors.push(`${menuLabel}: actions must be an array`);
    } else if (menu.actions.length > 0) {
      const actionIds = [];

      menu.actions.forEach((action, actionIndex) => {
        const actionLabel = `${menuLabel}, Action ${actionIndex + 1}`;

        // Action ID validation
        if (!action.id || !/^[a-zA-Z0-9_-]+$/.test(action.id)) {
          errors.push(`${actionLabel}: Invalid ID format (alphanumeric, dash, underscore only)`);
        } else {
          if (actionIds.includes(action.id)) {
            errors.push(`${actionLabel}: Duplicate action ID "${action.id}" within menu`);
          }
          actionIds.push(action.id);
        }

        // Action title and prompt validation
        if (!action.title?.trim()) {
          errors.push(`${actionLabel}: Title is required`);
        }
        if (!action.prompt?.trim()) {
          errors.push(`${actionLabel}: Prompt is required`);
        }

        // Shortcut validation
        if (action.shortcut && action.shortcut.trim()) {
          const validShortcutPattern = /^(Ctrl|Alt|Shift|Meta)(\+(Ctrl|Alt|Shift|Meta))*\+.+$/;
          if (!validShortcutPattern.test(action.shortcut)) {
            errors.push(`${actionLabel}: Invalid shortcut format (must include modifier keys)`);
          } else if (action.enabled) {
            // Only track enabled action shortcuts for duplicate detection
            allShortcuts.push({ shortcut: action.shortcut, source: `${menu.name} - ${action.title}` });
          }
        }

        // Boolean and number validations
        if (typeof action.enabled !== 'boolean') {
          errors.push(`${actionLabel}: enabled must be true or false`);
        }
        if (typeof action.order !== 'number') {
          errors.push(`${actionLabel}: order must be a number`);
        }
      });
    }
  });

  // Check for duplicate shortcuts across ALL menus
  const shortcutMap = new Map();
  allShortcuts.forEach(({ shortcut, source }) => {
    if (shortcutMap.has(shortcut)) {
      errors.push(`Duplicate shortcut "${shortcut}" used by: "${shortcutMap.get(shortcut)}" and "${source}"`);
    } else {
      shortcutMap.set(shortcut, source);
    }
  });

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
