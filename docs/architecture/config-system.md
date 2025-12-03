# Configuration System

Inkdown uses a centralized configuration system managed by the `ConfigManager` class. This document describes how configuration is stored, loaded, and managed.

## Overview

The `ConfigManager` (`packages/core/src/ConfigManager.ts`) provides a simple key-value store for persisting application and plugin settings.

## Storage Location

Configuration files are stored in the app's config directory:

```
~/Library/Application Support/com.furqas.inkdown/
├── config/
│   ├── app.json           # Application settings
│   ├── plugins.json       # Plugin enable/disable state
│   ├── installed-themes.json  # Installed community themes
│   └── [plugin-id].json   # Per-plugin settings
└── themes/
    └── ...                # Custom themes
```

## API

### Loading Configuration

```typescript
// Load typed configuration
const config = await app.configManager.loadConfig<AppConfig>('app');

// Returns null if config doesn't exist
if (config) {
    console.log(config.theme);
}
```

### Saving Configuration

```typescript
// Save configuration (creates file if doesn't exist)
await app.configManager.saveConfig('app', {
    theme: 'default-dark',
    colorScheme: 'dark',
    fontSize: 14
});
```

### Config File Names

| Config Key | File | Description |
|------------|------|-------------|
| `app` | `app.json` | Main app settings (theme, font size, etc.) |
| `plugins` | `plugins.json` | Plugin enable/disable state |
| `installed-themes` | `installed-themes.json` | Community theme installation records |
| `[plugin-id]` | `[plugin-id].json` | Plugin-specific settings |

## Configuration Types

### App Configuration

```typescript
interface AppConfig {
    theme: string;           // Current theme ID
    colorScheme: 'dark' | 'light';
    fontSize?: number;
    fontFamily?: string;
    // ... other app settings
}
```

### Plugin Configuration

Plugins can store their own configuration using their plugin ID as the key:

```typescript
// In a plugin
class MyPlugin extends Plugin {
    async onload() {
        // Load plugin settings
        const settings = await this.app.configManager.loadConfig<MySettings>(this.manifest.id);
        
        // Save plugin settings
        await this.app.configManager.saveConfig(this.manifest.id, {
            enabled: true,
            customOption: 'value'
        });
    }
}
```

### Installed Themes Configuration

```typescript
interface InstalledThemesConfig {
    themes: InstalledCommunityTheme[];
}

interface InstalledCommunityTheme {
    id: string;           // Repository ID (e.g., "author/theme-name")
    name: string;
    author: string;
    version: string;
    installedAt: number;  // Timestamp
    modes: ('dark' | 'light')[];
}
```

## Rust Backend

Configuration file operations are handled by Tauri commands:

| Command | Description |
|---------|-------------|
| `read_config_file` | Reads a JSON config file |
| `write_config_file` | Writes a JSON config file |
| `config_file_exists` | Checks if a config file exists |

## Best Practices

1. **Type Safety**: Always define TypeScript interfaces for your configuration
2. **Defaults**: Handle missing configuration gracefully with default values
3. **Validation**: Validate loaded configuration before using
4. **Atomic Writes**: ConfigManager handles atomic writes to prevent corruption

```typescript
// Good: Handle missing config with defaults
const config = await configManager.loadConfig<MyConfig>('my-plugin');
const settings = {
    option1: config?.option1 ?? 'default',
    option2: config?.option2 ?? true
};
```
