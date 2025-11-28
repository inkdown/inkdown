import type React from 'react';
import type { App } from '../App';

/**
 * Plugin manifest definition
 */
export interface PluginManifest {
    /** Unique identifier for the plugin (lowercase, hyphenated) */
    id: string;
    /** Display name of the plugin */
    name: string;
    /** Semantic version (e.g., "1.0.0") */
    version: string;
    /** Minimum Inkdown version required (e.g., "0.1.0") */
    minAppVersion?: string;
    /** Brief description of the plugin's functionality */
    description: string;
    /** Author name or organization */
    author: string;
    /** URL to author's website or profile */
    authorUrl?: string;
    /** URL to plugin's documentation or repository */
    helpUrl?: string;
    /** URL to plugin repository */
    repo?: string;
    /** Whether the plugin is currently in beta/experimental */
    isBeta?: boolean;
    /** License type (e.g., "MIT", "GPL-3.0") */
    license?: string;
    /** Keywords for search/discovery */
    keywords?: string[];
    /** URL to funding/donation page */
    fundingUrl?: string;
}

/**
 * Command definition for keyboard shortcuts and command palette
 */
export interface Command {
    /** Unique identifier for the command */
    id: string;
    /** Display name shown in command palette */
    name: string;
    /** Function to execute when command is triggered */
    callback: () => void | Promise<void>;
    /** Default hotkey combinations */
    hotkeys?: Hotkey[];
    /** Legacy hotkey format (deprecated, use hotkeys instead) */
    hotkey?: string[];
    /** Callback that receives the editor instance */
    editorCallback?: (editor: any, view: any) => void | Promise<void>;
    /** Callback that can return false to disable the command */
    checkCallback?: (checking: boolean) => boolean;
    /** Icon to show in command palette or menus */
    icon?: string;
}

/**
 * Hotkey definition
 */
export interface Hotkey {
    /** Modifier keys: 'Mod' (Ctrl/Cmd), 'Ctrl', 'Meta', 'Alt', 'Shift' */
    modifiers: ('Mod' | 'Ctrl' | 'Meta' | 'Alt' | 'Shift')[];
    /** The key to press */
    key: string;
}

import type { ItemView } from '../views/ItemView';

/**
 * View creator function type
 */
export type ViewCreator = () => ItemView;

/**
 * Legacy setting tab interface - for backwards compatibility
 * Use PluginSettingTab class for new plugins
 *
 * @deprecated Use PluginSettingTab class instead
 */
export interface SettingTab {
    id: string;
    name: string;
    icon?: string;
    /** DOM-based rendering (legacy/simple) */
    display?: (containerEl: HTMLElement) => void;
    /** React component for rendering (preferred) */
    component?: React.ComponentType<SettingTabProps>;
}

/**
 * Props passed to React-based setting tab components
 */
export interface SettingTabProps {
    app: App;
    pluginId: string;
}

/**
 * Plugin base interface (implemented by Plugin abstract class)
 */
export interface IPlugin {
    app: App;
    manifest: PluginManifest;
    enabled: boolean;

    onload(): Promise<void>;
    onunload(): Promise<void>;

    loadData<T>(): Promise<T | undefined>;
    saveData(data: any): Promise<void>;

    addCommand(command: Command): Command;
    registerCommand(command: Command): void;
    registerView(viewType: string, viewCreator: ViewCreator): void;
    addSettingTab(tab: any): void;
    addRibbonIcon(icon: string, title: string, callback: () => void): HTMLElement;
    addStatusBarItem(): HTMLElement;
}
