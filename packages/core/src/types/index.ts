/**
 * @inkdown/core - Types Index
 *
 * Re-exports all types from the types directory
 */

export type {
    CommunityPlugin,
    CommunityPluginCache,
    CommunityPluginListing,
    CommunityPluginManifest,
    InstalledCommunityPlugin,
    InstalledPluginsConfig,
    PluginInstallResult,
    PluginLoadResult,
    PluginUpdateInfo,
} from './community-plugin';
export type {
    AppConfig,
    FontConfig,
    TabConfig,
} from './config';
export type {
    Command,
    IPlugin,
    PluginManifest,
    SettingTab,
    SettingTabProps,
    ViewCreator,
} from './plugin';

export type {
    DefaultShortcuts,
    KeyboardShortcut,
    ModifierKey,
    ShortcutConfig,
    ShortcutsConfig,
} from './shortcuts';

export type {
    Tab,
    TabContent,
    TabOptions,
} from './tab';

export type {
    ThemeConfig,
    ThemeManifest,
} from './theme';
