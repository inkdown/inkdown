import type { App as InkdownApp, PluginSettingTab } from '@inkdown/core';
import { Button, Link, Select, Setting, Slider, TextInput, Toggle } from '@inkdown/ui';
import { Cloud, Keyboard, Palette, Puzzle, RefreshCw, Settings as SettingsIcon, Trash2, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { useConfig } from '../hooks/useConfig';
import { PluginsSettings } from './PluginsSettings';
import { ShortcutsSettings } from './ShortcutsSettings';
import { EncryptionPasswordModal } from './EncryptionPasswordModal';
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
    const [localDbName, setLocalDbName] = useState<string>('inkdown-sync-cache');
    const [forceUpdateValue, forceUpdate] = useState(0);
    const [, setPluginVersion] = useState(0); // Used to trigger re-render when plugins change

    // Encryption Modal State
    const [showEncryptionModal, setShowEncryptionModal] = useState(false);
    const [encryptionMode, setEncryptionMode] = useState<'setup' | 'unlock'>('unlock');

    // Sync Settings State
    const [ignoredPatterns, setIgnoredPatterns] = useState<string[]>([]);
    const [newPattern, setNewPattern] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);

    // Load local DB name and ignore patterns
    useEffect(() => {
        const loadSyncData = async () => {
            try {
                const syncConfig = await app.configManager.loadConfig<any>('sync');
                if (syncConfig?.localDbName) {
                    setLocalDbName(syncConfig.localDbName);
                }

                // Load ignore patterns
                const patterns = app.syncManager.selectiveSync.getIgnorePatterns();
                setIgnoredPatterns(patterns);
            } catch (error) {
                console.error('Failed to load sync data:', error);
            }
        };
        loadSyncData();
    }, [app, forceUpdateValue]);

    // Memoize sync state to prevent unnecessary re-renders
    const isLoggedIn = useMemo(() => app.syncManager.isLoggedIn(), [
        app.syncManager,
        forceUpdateValue, // Recompute when forceUpdate changes
    ]);

    const isSyncEnabled = useMemo(() => app.syncManager.isEnabled(), [
        app.syncManager,
        forceUpdateValue, // Recompute when forceUpdate changes
    ]);


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

    // Handler callbacks - must be hooks called before early return
    const handleEnableSync = useCallback(async (enabled: boolean) => {
        if (!enabled) {
            await app.syncManager.disable();
            forceUpdate((v) => v + 1);
            return;
        }

        // If enabling, check if we need encryption setup
        if (isLoggedIn) {
            try {
                // Check if keys exist on server to decide setup vs unlock
                const hasKeys = await app.syncManager.hasKeysOnServer();

                if (hasKeys) {
                    setEncryptionMode('unlock');
                } else {
                    setEncryptionMode('setup');
                }

                setShowEncryptionModal(true);
            } catch (error) {
                console.error('Failed to prepare sync enablement:', error);
                // Fallback to unlock if check fails
                setEncryptionMode('unlock');
                setShowEncryptionModal(true);
            }
        } else {
            // Not logged in, just enable (will prompt login later or show login link)
            await app.syncManager.enable();
            forceUpdate((v) => v + 1);
        }
    }, [app.syncManager, isLoggedIn, forceUpdate, setEncryptionMode, setShowEncryptionModal]);

    const handleEncryptionConfirm = useCallback(async (password: string) => {
        try {
            if (encryptionMode === 'setup') {
                await app.syncManager.setupEncryption(password);
            } else {
                // Try to unlock
                try {
                    await app.syncManager.unlockEncryption(password);
                } catch (error: any) {
                    // If unlock fails because keys not found (404), maybe we need setup?
                    if (error.message && (error.message.includes('404') || error.message.includes('Key not found'))) {
                        // HACK: If unlock fails with 404, we assume it's a new user and try setup
                        console.log('Unlock failed, trying setup...', error);
                        await app.syncManager.setupEncryption(password);
                    } else {
                        throw error;
                    }
                }
            }
            setShowEncryptionModal(false);
            forceUpdate((v) => v + 1);
        } catch (error) {
            console.error('Encryption setup/unlock failed:', error);
            throw error; // Modal will display error
        }
    }, [app.syncManager, encryptionMode, setShowEncryptionModal, forceUpdate]);

    const handleSyncNow = async () => {
        setIsSyncing(true);
        try {
            await app.syncManager.syncNow();
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleClearLocalData = async () => {
        if (window.confirm('Are you sure you want to clear all local sync data? This will remove cached notes and metadata. Your local files will NOT be deleted.')) {
            try {
                await app.syncManager.localDatabase.clear();
                alert('Local sync data cleared.');
            } catch (error) {
                console.error('Failed to clear local data:', error);
                alert('Failed to clear local data.');
            }
        }
    };

    const handleAddPattern = async () => {
        if (!newPattern.trim()) return;
        await app.syncManager.selectiveSync.addIgnorePattern(newPattern.trim());
        setIgnoredPatterns(app.syncManager.selectiveSync.getIgnorePatterns());
        setNewPattern('');
    };

    const handleRemovePattern = async (pattern: string) => {
        await app.syncManager.selectiveSync.removeIgnorePattern(pattern);
        setIgnoredPatterns(app.syncManager.selectiveSync.getIgnorePatterns());
    };

    // Regular functions (not hooks)

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
        { id: 'sync', label: 'Sync', icon: <Cloud size={16} /> },
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
        <>
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

                            {activeTab === 'sync' && (
                                <div className="settings-section">
                                    <h3>Sync Settings</h3>
                                    <p className="settings-description">
                                        Synchronize your notes across devices with end-to-end encryption.
                                    </p>

                                    <Setting
                                        name="Enable Sync"
                                        description="Turn on synchronization functionality"
                                    >
                                        <Toggle
                                            checked={isSyncEnabled}
                                            onChange={handleEnableSync}
                                        />
                                    </Setting>

                                    {isLoggedIn ? (
                                        <>
                                            <Setting
                                                name="Account"
                                                description={`Logged in as ${app.syncManager.tokenManager.getUserEmail()}`}
                                            >
                                                <Button
                                                    variant="secondary"
                                                    size="small"
                                                    onClick={async () => {
                                                        await app.syncManager.logout(false);
                                                        forceUpdate((v) => v + 1);
                                                    }}
                                                >
                                                    Logout
                                                </Button>
                                            </Setting>

                                            {isSyncEnabled && (
                                                <Setting
                                                    name="Local Database"
                                                    description="Name of the local cache database (IndexedDB)"
                                                >
                                                    <TextInput
                                                        value={localDbName}
                                                        onChange={(value: string) => setLocalDbName(value)}
                                                        onBlur={async () => {
                                                            try {
                                                                await app.syncManager.localDatabase.changeDatabaseName(localDbName);
                                                            } catch (error) {
                                                                console.error('Failed to change database:', error);
                                                            }
                                                        }}
                                                        placeholder="inkdown-sync-cache"
                                                    />
                                                </Setting>
                                            )}

                                            <Setting
                                                name="Sync Now"
                                                description="Manually trigger synchronization"
                                            >
                                                <Button
                                                    size="small"
                                                    onClick={handleSyncNow}
                                                    disabled={isSyncing}
                                                >
                                                    <RefreshCw size={14} className={isSyncing ? 'spin' : ''} />
                                                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                                                </Button>
                                            </Setting>

                                            <Setting
                                                name="Ignored Patterns"
                                                description="Glob patterns to exclude from sync"
                                            >
                                                <div className="ignore-patterns-list">
                                                    <div className="add-pattern-row">
                                                        <TextInput
                                                            value={newPattern}
                                                            onChange={setNewPattern}
                                                            placeholder="e.g. *.tmp, node_modules/**"
                                                            onKeyDown={(e) => e.key === 'Enter' && handleAddPattern()}
                                                        />
                                                        <Button size="small" onClick={handleAddPattern}>Add</Button>
                                                    </div>
                                                    <div className="patterns-container">
                                                        {ignoredPatterns.map(pattern => (
                                                            <div key={pattern} className="pattern-item">
                                                                <span>{pattern}</span>
                                                                <button
                                                                    className="remove-pattern-btn"
                                                                    onClick={() => handleRemovePattern(pattern)}
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </Setting>

                                            <Setting
                                                name="Clear Local Data"
                                                description="Clear local sync cache (does not delete files)"
                                            >
                                                <Button
                                                    variant="danger"
                                                    size="small"
                                                    onClick={handleClearLocalData}
                                                >
                                                    <Trash2 size={14} />
                                                    Clear Data
                                                </Button>
                                            </Setting>
                                        </>
                                    ) : (
                                        <Setting
                                            name="Account"
                                            description="Not logged in"
                                        >
                                            <Link
                                                href="https://sync.inkdown.app/login"
                                                external
                                                app={app}
                                            >
                                                Login to Sync →
                                            </Link>
                                        </Setting>
                                    )}
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

            <EncryptionPasswordModal
                isOpen={showEncryptionModal}
                mode={encryptionMode}
                onConfirm={handleEncryptionConfirm}
                onCancel={() => setShowEncryptionModal(false)}
            />
        </>
    );
};
