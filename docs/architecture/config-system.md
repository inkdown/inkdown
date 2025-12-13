# Configuration System

Inkdown uses a centralized configuration system managed by the `ConfigManager` class. This document describes how configuration is stored, loaded, and managed across the application.

## Overview

The `ConfigManager` (`packages/core/src/ConfigManager.ts`) provides a simple key-value store for persisting application and plugin settings as JSON files.

## Storage Location

Configuration files are stored in the app's config directory:

| Platform | Path |
|----------|------|
| macOS | `~/Library/Application Support/com.furqas.inkdown/` |
| Windows | `%APPDATA%\com.furqas.inkdown\` |
| Linux | `~/.config/com.furqas.inkdown/` |

### Directory Structure

```
~/Library/Application Support/com.furqas.inkdown/
├── config/
│   ├── app.json              # Application settings
│   ├── installed-themes.json # Installed community themes
│   └── installed-plugins.json # Installed community plugins
├── plugins/
│   └── plugin-id/            # Community plugins
│       ├── manifest.json
│       └── main.js
└── themes/
    └── theme-id/             # Custom themes
        ├── manifest.json
        ├── dark.css
        └── light.css
```

## ConfigManager API

### Loading Configuration

```typescript
// Load typed configuration
const config = await app.configManager.loadConfig<AppConfig>('app');

// Returns null if config doesn't exist
if (config) {
    console.log(config.theme);
    console.log(config.colorScheme);
}
```

### Saving Configuration

```typescript
// Save configuration (creates file if doesn't exist)
await app.configManager.saveConfig('app', {
    theme: 'default-dark',
    colorScheme: 'dark',
    fontSize: 14,
    plugins: [
        { id: 'word-count', enabled: true },
        { id: 'quick-finder', enabled: true }
    ]
});
```

### Config File Mapping

| Config Key | File | Description |
|------------|------|-------------|
| `app` | `app.json` | Main app settings (theme, font, plugins state) |
| `installed-themes` | `installed-themes.json` | Community theme installation records |
| `installed-plugins` | `installed-plugins.json` | Community plugin installation records |

## Configuration Types

### App Configuration

The main application configuration stored in `app.json`:

```typescript
interface AppConfig {
    // Theme settings
    theme: string;                    // Current theme ID
    colorScheme: 'dark' | 'light';    // Color scheme
    
    // Editor settings
    fontSize?: number;
    fontFamily?: string;
    lineHeight?: number;
    
    // Plugin states
    plugins?: PluginConfig[];
    
    // Workspace
    recentFiles?: string[];
    lastOpenedFile?: string;
    sidebarWidth?: number;
}

interface PluginConfig {
    id: string;
    enabled: boolean;
    settings?: Record<string, any>;
}
```

### Plugin Data Storage

Plugins store their settings within the app config through the Plugin API:

```typescript
// In a plugin
class MyPlugin extends Plugin {
    settings: MySettings = DEFAULT_SETTINGS;
    
    async onload() {
        // Load plugin settings (stored in app.json under plugins array)
        const data = await this.loadData<MySettings>();
        this.settings = { ...DEFAULT_SETTINGS, ...data };
    }
    
    async saveSettings() {
        // Save plugin settings
        await this.saveData(this.settings);
    }
}
```

The PluginManager handles storing plugin settings within the `plugins` array in `app.json`:

```json
{
  "theme": "default-dark",
  "colorScheme": "dark",
  "plugins": [
    {
      "id": "word-count",
      "enabled": true,
      "settings": {
        "showCharCount": false,
        "showWordCount": true,
        "countSpaces": false
      }
    },
    {
      "id": "quick-finder",
      "enabled": true,
      "settings": {}
    }
  ]
}
```

### Installed Themes Configuration

```typescript
interface InstalledThemesConfig {
    themes: InstalledCommunityTheme[];
}

interface InstalledCommunityTheme {
    id: string;              // Repository ID (e.g., "author/theme-name")
    name: string;
    author: string;
    version: string;
    installedAt: number;     // Timestamp
    modes: ('dark' | 'light')[];
}
```

## Tauri Backend

Configuration file operations are handled by Tauri commands in the Rust backend:

| Command | Description |
|---------|-------------|
| `read_config_file` | Reads and parses a JSON config file |
| `write_config_file` | Writes data to a JSON config file |
| `config_file_exists` | Checks if a config file exists |
| `get_config_dir` | Returns the config directory path |

## Best Practices

### 1. Type Safety

Always define TypeScript interfaces for your configuration:

```typescript
interface MyPluginSettings {
    apiKey: string;
    enabled: boolean;
    maxItems: number;
}
```

### 2. Default Values

Handle missing configuration gracefully with default values:

```typescript
const DEFAULT_SETTINGS: MyPluginSettings = {
    apiKey: '',
    enabled: true,
    maxItems: 10
};

// Use spread to merge with defaults
const settings = { ...DEFAULT_SETTINGS, ...await this.loadData() };
```

### 3. Validation

Validate loaded configuration before using:

```typescript
function validateSettings(data: unknown): MyPluginSettings {
    const settings = data as Partial<MyPluginSettings>;
    return {
        apiKey: typeof settings.apiKey === 'string' ? settings.apiKey : '',
        enabled: typeof settings.enabled === 'boolean' ? settings.enabled : true,
        maxItems: typeof settings.maxItems === 'number' ? settings.maxItems : 10
    };
}
```

### 4. Atomic Writes

The ConfigManager handles atomic writes to prevent corruption during crashes.

## Related Documentation

- [Plugin System](../plugins/system.md) - How plugins use configuration
- [Theme System](./theme-system.md) - Theme configuration storage
