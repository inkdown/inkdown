import type { App as InkdownApp, PluginSettingTab } from '@inkdown/core';
import { Button, Select, Setting, Slider } from '@inkdown/ui';
import { Keyboard, Palette, Puzzle, Settings as SettingsIcon, Trash2, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { useConfig } from '../hooks/useConfig';
import { PluginsSettings } from './PluginsSettings';
import { ShortcutsSettings } from './ShortcutsSettings';
import './SettingsModal.css';

interface AppConfig {
    version: string;
    workspace?: string;
    font?: {
        size?: number;
        family?: string;
    };
}

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SettingsTab = 'general' | 'appearance' | 'shortcuts' | 'plugins' | string;

interface TabInfo {
    id: SettingsTab;
    label: string;
    icon: React.ReactNode;
    isPlugin?: boolean;
    pluginId?: string;
}

/**
 * Plugin Setting Tab Renderer - renders plugin settings tabs
 * Uses the PluginSettingTab class with display() method for DOM rendering
 */
const PluginSettingTabContent: React.FC<{
    tab: PluginSettingTab & { pluginId: string };
    app: InkdownApp;
}> = ({ tab }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Call the display() method from PluginSettingTab
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
            // Mount the tab's containerEl into our ref
            tab.containerEl.innerHTML = '';
            tab.display();
            containerRef.current.appendChild(tab.containerEl);
        }

        return () => {
            // Call hide() when unmounting
            tab.hide?.();
        };
    }, [tab]);

    return (
        <div className="settings-section">
            <div ref={containerRef} className="plugin-setting-tab-content" />
        </div>
    );
};

/**
 * Settings Modal Component - Modal-based settings interface with sidebar
 */
export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const app = useApp();
    const { currentTheme, colorScheme, setTheme, setColorScheme, themes } = useTheme();
    const [config, saveConfig] = useConfig<AppConfig>('app');
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [, setPluginVersion] = useState(0); // Used to trigger re-render when plugins change

    // Subscribe to plugin changes to update sidebar
    useEffect(() => {
        const unsubscribe = app.pluginManager.onPluginChange((_pluginId, changeType) => {
            // Force re-render when a plugin is enabled or disabled
            if (changeType === 'enabled' || changeType === 'disabled') {
                setPluginVersion((v) => v + 1);
            }
        });

        return () => unsubscribe();
    }, [app.pluginManager]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleFontSizeChange = async (size: number) => {
        if (!config) return;

        const newConfig = { ...config, font: { ...config.font, size } };
        await saveConfig(newConfig);

        localStorage.setItem('inkdown-font-size', String(size));
        document.documentElement.style.setProperty('--font-size-base', `${size}px`);
        document.documentElement.style.setProperty('--font-size-editor', `${size}px`);
    };

    const handleFontFamilyChange = async (family: string) => {
        if (!config) return;

        const newConfig = { ...config, font: { ...config.font, family } };
        await saveConfig(newConfig);

        localStorage.setItem('inkdown-font-family', family);
        document.documentElement.style.setProperty('--font-family', family);
    };

    const handleColorSchemeChange = async (scheme: 'light' | 'dark') => {
        await setColorScheme(scheme);
    };

    /**
     * Clear all app cache (localStorage and IndexedDB)
     * This will reset all settings and tabs to defaults
     */
    const handleClearCache = async () => {
        const confirmed = window.confirm(
            'This will clear all cached data including tabs, settings, and editor state. The app will reload. Continue?',
        );

        if (!confirmed) return;

        try {
            // Clear localStorage (config cache)
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('inkdown')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach((key) => localStorage.removeItem(key));
            console.log(`[Settings] Cleared ${keysToRemove.length} localStorage entries`);

            // Clear IndexedDB databases
            const databases = await indexedDB.databases();
            for (const db of databases) {
                if (db.name && db.name.startsWith('inkdown')) {
                    indexedDB.deleteDatabase(db.name);
                    console.log(`[Settings] Deleted IndexedDB: ${db.name}`);
                }
            }

            // Reload the app
            window.location.reload();
        } catch (error) {
            console.error('Failed to clear cache:', error);
            alert('Failed to clear cache. Check console for details.');
        }
    };

    if (!isOpen) return null;

    // Get plugin setting tabs from enabled plugins
    const pluginSettingTabs = app.pluginManager.getAllSettingTabs();

    const tabs: TabInfo[] = [
        { id: 'general', label: 'General', icon: <SettingsIcon size={16} /> },
        { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
        { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard size={16} /> },
        { id: 'plugins', label: 'Plugins', icon: <Puzzle size={16} /> },
    ];

    // Create tabs for plugin-registered settings
    // Use pluginId + name as unique identifier since PluginSettingTab uses the name property
    const pluginTabs: TabInfo[] = pluginSettingTabs.map((tab) => ({
        id: `plugin-${tab.pluginId}`,
        label: tab.name,
        icon: null,
        isPlugin: true,
        pluginId: tab.pluginId,
    }));

    // Find the active plugin tab if one is selected
    const activePluginTab = pluginSettingTabs.find((tab) => activeTab === `plugin-${tab.pluginId}`);

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="settings-modal-header">
                    <h2>Settings</h2>
                    <button className="settings-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="settings-modal-body">
                    {/* Sidebar */}
                    <nav className="settings-sidebar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                className={`settings-sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}

                        {/* Plugin setting tabs separator */}
                        {pluginTabs.length > 0 && (
                            <div className="settings-sidebar-separator">
                                <span>Plugin Settings</span>
                            </div>
                        )}

                        {/* Plugin setting tabs */}
                        {pluginTabs.map((tab) => (
                            <button
                                key={tab.id}
                                className={`settings-sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* Content */}
                    <div className="settings-modal-content">
                        {activeTab === 'general' && config && (
                            <div className="settings-section">
                                <h3>General Settings</h3>
                                <Setting
                                    name="App Version"
                                    description="Current version of Inkdown"
                                >
                                    <span className="setting-value">
                                        {config.version || '0.1.0'}
                                    </span>
                                </Setting>

                                <Setting name="Workspace" description="Current workspace path">
                                    <span className="setting-value setting-path">
                                        {config.workspace || 'No workspace selected'}
                                    </span>
                                </Setting>

                                <h3>Maintenance</h3>
                                <Setting
                                    name="Clear Cache"
                                    description="Clear all cached data including tabs, settings, and editor state. The app will reload after clearing."
                                >
                                    <Button
                                        variant="danger"
                                        size="small"
                                        onClick={handleClearCache}
                                    >
                                        <Trash2 size={14} />
                                        Clear Cache
                                    </Button>
                                </Setting>
                            </div>
                        )}

                        {activeTab === 'appearance' && config && (
                            <div className="settings-section">
                                <h3>Appearance</h3>

                                <Setting
                                    name="Color Scheme"
                                    description="Choose between light and dark mode"
                                >
                                    <Select
                                        value={colorScheme}
                                        onChange={(value: string) =>
                                            handleColorSchemeChange(value as 'light' | 'dark')
                                        }
                                        options={[
                                            { value: 'dark', label: 'Dark' },
                                            { value: 'light', label: 'Light' },
                                        ]}
                                    />
                                </Setting>

                                <Setting name="Theme" description="Choose your theme">
                                    <Select
                                        value={currentTheme}
                                        onChange={(value: string) => setTheme(value)}
                                        options={themes.map((theme) => ({
                                            value: theme.id,
                                            label: theme.name,
                                        }))}
                                    />
                                </Setting>

                                <Setting
                                    name="Font Size"
                                    description="Application font size in pixels (affects all UI)"
                                >
                                    <Slider
                                        value={config.font?.size || 14}
                                        onChange={(value: number) => handleFontSizeChange(value)}
                                        min={12}
                                        max={24}
                                        unit="px"
                                    />
                                </Setting>

                                <Setting
                                    name="Font Family"
                                    description="Application font family (affects all UI)"
                                >
                                    <Select
                                        value={config.font?.family || 'System UI'}
                                        onChange={(value: string) => handleFontFamilyChange(value)}
                                        options={[
                                            {
                                                value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                                                label: 'System Default',
                                            },
                                            ...app.fontManager.getCachedFonts().map((font) => ({
                                                value: font,
                                                label: font,
                                            })),
                                        ]}
                                    />
                                </Setting>
                            </div>
                        )}

                        {activeTab === 'shortcuts' && (
                            <div className="settings-section">
                                <h3>Keyboard Shortcuts</h3>
                                <p className="settings-description">
                                    Customize keyboard shortcuts for various actions.
                                </p>
                                <ShortcutsSettings />
                            </div>
                        )}

                        {activeTab === 'plugins' && (
                            <div className="settings-section">
                                <h3>Plugins</h3>
                                <p className="settings-description">
                                    Manage your installed plugins. Disable plugins to reduce memory
                                    usage.
                                </p>
                                <PluginsSettings />
                            </div>
                        )}

                        {/* Plugin setting tabs content */}
                        {activePluginTab && (
                            <PluginSettingTabContent tab={activePluginTab} app={app} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
