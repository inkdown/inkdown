import type { FileNode, App as InkdownApp, PluginSettingTab } from '@inkdown/core';
import type { WindowConfig } from '../managers/WindowConfigManager';
import {
    Button,
    Select,
    Setting,
    Slider,
    TextInput,
    Toggle,
    WorkspaceLinkDialog,
    type WorkspaceLinkWorkspace,
} from '@inkdown/ui';
import {
    Cloud,
    FolderOpen,
    Keyboard,
    Link,
    Paintbrush,
    Palette,
    Puzzle,
    RefreshCw,
    Settings as SettingsIcon,
    Trash2,
    Type,
    Unlink,
    X,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { useConfig } from '../hooks/useConfig';
import { EncryptionPasswordModal } from './EncryptionPasswordModal';
import { PluginsSettings } from './PluginsSettings';
import { ShortcutsSettings } from './ShortcutsSettings';
import { ThemesSettings } from './ThemesSettings';
import './SettingsModal.css';

/**
 * Autocomplete Input Component
 * Shows suggestions as the user types
 */
interface AutocompleteInputProps {
    value: string;
    onChange: (value: string) => void;
    suggestions: string[];
    placeholder?: string;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
    value,
    onChange,
    suggestions,
    placeholder,
}) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter suggestions based on input value
    useEffect(() => {
        const trimmedValue = (value || '').trim();
        if (trimmedValue) {
            const filtered = suggestions
                .filter((s) => s.toLowerCase().includes(trimmedValue.toLowerCase()))
                .slice(0, 8); // Limit to 8 suggestions
            setFilteredSuggestions(filtered);
        } else {
            // Show first 8 suggestions when input is empty but focused
            setFilteredSuggestions(suggestions.slice(0, 8));
        }
        setSelectedIndex(-1);
    }, [value, suggestions]);

    // Handle click outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || filteredSuggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < filteredSuggestions.length - 1 ? prev + 1 : prev,
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    onChange(filteredSuggestions[selectedIndex]);
                    setShowSuggestions(false);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                break;
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        onChange(suggestion);
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    return (
        <div className="autocomplete-input-container" ref={containerRef}>
            <input
                ref={inputRef}
                type="text"
                className="autocomplete-input"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
                <ul className="autocomplete-suggestions">
                    {filteredSuggestions.map((suggestion, index) => (
                        <li
                            key={suggestion}
                            className={`autocomplete-suggestion ${index === selectedIndex ? 'selected' : ''}`}
                            onClick={() => handleSuggestionClick(suggestion)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <FolderOpen size={14} />
                            <span>{suggestion}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

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
    onShowLoginScreen?: () => void;
}

type SettingsTab = 'general' | 'appearance' | 'editor' | 'shortcuts' | 'plugins' | string;

/**
 * Editor configuration interface
 */
export interface EditorConfig {
    autoPairBrackets: boolean;
    tabIndentation: boolean;
    convertPastedHtmlToMarkdown: boolean;
    vimMode: boolean;
    showLineNumbers: boolean;
    foldHeading: boolean;
}

/**
 * Files configuration interface
 */
export interface FilesConfig {
    /** Location type for new notes: 'root' or 'folder' */
    newNotesLocation: 'root' | 'folder';
    /** Custom folder path for new notes (relative to workspace) */
    newNotesFolder: string;
    /** Location type for new attachments: 'root' or 'folder' */
    newAttachmentsLocation: 'root' | 'folder';
    /** Custom folder path for new attachments (relative to workspace) */
    newAttachmentsFolder: string;
}

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
export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    onShowLoginScreen,
}) => {
    const app = useApp();
    const { currentTheme, colorScheme, setTheme, setColorScheme, themes } = useTheme();
    const [config, saveConfig] = useConfig<AppConfig>('app');
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [localDbName, setLocalDbName] = useState<string>('inkdown-sync-cache');
    const [_forceUpdateValue, forceUpdate] = useState(0);
    const [, setPluginVersion] = useState(0); // Used to trigger re-render when plugins change

    // Encryption Modal State
    const [showEncryptionModal, setShowEncryptionModal] = useState(false);
    const [encryptionMode, setEncryptionMode] = useState<'setup' | 'unlock'>('unlock');

    // Sync Settings State
    const [ignoredPatterns, setIgnoredPatterns] = useState<string[]>([]);
    const [newPattern, setNewPattern] = useState('');
    const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false);
    const [showWorkspaceSelectionAfterPassword, setShowWorkspaceSelectionAfterPassword] = useState(false);
    const [linkedWorkspace, setLinkedWorkspace] = useState<WorkspaceLinkWorkspace | null>(null);

    // Editor Settings State
    const [editorConfig, setEditorConfig] = useState<EditorConfig>({
        autoPairBrackets: true,
        tabIndentation: true,
        convertPastedHtmlToMarkdown: true,
        vimMode: false,
        showLineNumbers: false,
        foldHeading: true,
    });

    // Files Settings State
    const [filesConfig, setFilesConfig] = useState<FilesConfig>({
        newNotesLocation: 'root',
        newNotesFolder: '',
        newAttachmentsLocation: 'root',
        newAttachmentsFolder: '',
    });
    const [workspaceFolders, setWorkspaceFolders] = useState<string[]>([]);

    // Window Settings State
    const [windowConfig, setWindowConfig] = useState<WindowConfig>({
        customTitleBar: false,
    });

    // Load editor config
    useEffect(() => {
        const loadEditorConfig = async () => {
            try {
                const config = await app.configManager.loadConfig<EditorConfig>('editor');
                if (config) {
                    setEditorConfig(config);
                }
            } catch (error: any) {
                console.error('Failed to load editor config:', error);
            }
        };
        loadEditorConfig();
    }, [app]);

    // Load files config and workspace folders
    useEffect(() => {
        const loadFilesConfig = async () => {
            try {
                const config = await app.configManager.loadConfig<FilesConfig>('files');
                if (config) {
                    setFilesConfig(config);
                }
            } catch (error: any) {
                console.error('Failed to load files config:', error);
            }
        };

        const loadWorkspaceFolders = async () => {
            try {
                const appConfig = await app.configManager.loadConfig<AppConfig>('app');
                if (appConfig?.workspace) {
                    const files = await app.fileSystemManager.readDirectory(
                        appConfig.workspace,
                        true,
                    );
                    const folders: string[] = [];

                    const collectFolders = (nodes: FileNode[]) => {
                        for (const node of nodes) {
                            if (node.isDirectory) {
                                // Get relative path from workspace root
                                const relativePath = node.path.replace(
                                    `${appConfig.workspace}/`,
                                    '',
                                );
                                folders.push(relativePath);
                                if (node.children) {
                                    collectFolders(node.children);
                                }
                            }
                        }
                    };

                    collectFolders(files);
                    setWorkspaceFolders(folders.sort());
                }
            } catch (error: any) {
                console.error('Failed to load workspace folders:', error);
            }
        };

        loadFilesConfig();
        loadWorkspaceFolders();
    }, [app]);

    // Load window config
    useEffect(() => {
        const loadWindowConfig = async () => {
            try {
                const config = await app.windowConfigManager.loadConfig();
                if (config) {
                    setWindowConfig(config);
                }
            } catch (error: any) {
                console.error('Failed to load window config:', error);
            }
        };
        loadWindowConfig();
    }, [app]);

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

                // Load linked workspace
                const currentWorkspaceId = app.syncManager.getCurrentWorkspaceId();
                if (currentWorkspaceId) {
                    try {
                        const allWorkspaces = await app.syncManager.listWorkspaces();
                        const linked = allWorkspaces.find((w) => w.id === currentWorkspaceId);
                        if (linked) {
                            setLinkedWorkspace(linked);
                        }
                    } catch (err) {
                        console.error('Failed to load linked workspace:', err);
                    }
                }
            } catch (error: any) {
                console.error('Failed to load sync data:', error);
            }
        };
        loadSyncData();
    }, [app]);

    // Memoize sync state to prevent unnecessary re-renders
    const isLoggedIn = useMemo(() => app.syncManager.isLoggedIn(), [app.syncManager]);

    const isSyncEnabled = useMemo(() => app.syncManager.isEnabled(), [app.syncManager]);

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
    const handleEnableSync = useCallback(
        async (enabled: boolean) => {
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
                } catch (error: any) {
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
        },
        [app.syncManager, isLoggedIn],
    );

    const handleEncryptionConfirm = useCallback(
        async (password: string) => {
            try {
                // Check if workspace is already linked BEFORE setting up encryption
                const currentWorkspaceId = app.syncManager.getCurrentWorkspaceId();
                const needsWorkspaceSelection = !currentWorkspaceId;
                
                if (encryptionMode === 'setup') {
                    // Don't auto-enable if we need workspace selection first
                    await app.syncManager.setupEncryption(password, !needsWorkspaceSelection);
                } else {
                    // Try to unlock
                    try {
                        await app.syncManager.unlockEncryption(password, !needsWorkspaceSelection);
                    } catch (error: any) {
                        // If unlock fails because keys not found (404), maybe we need setup?
                        if (
                            error.message &&
                            (error.message.includes('404') ||
                                error.message.includes('Key not found'))
                        ) {
                            // HACK: If unlock fails with 404, we assume it's a new user and try setup
                            console.log('Unlock failed, trying setup...', error);
                            await app.syncManager.setupEncryption(password, !needsWorkspaceSelection);
                        } else {
                            throw error;
                        }
                    }
                }
                
                // Close password modal
                setShowEncryptionModal(false);
                
                if (needsWorkspaceSelection) {
                    // No workspace linked - show workspace selection dialog
                    // Sync will be enabled AFTER workspace is selected
                    setShowWorkspaceSelectionAfterPassword(true);
                    setShowWorkspaceDialog(true);
                } else {
                    // Workspace already linked - sync was auto-enabled
                    forceUpdate((v) => v + 1);
                }
            } catch (error: any) {
                console.error('Encryption setup/unlock failed:', error);
                throw error; // Modal will display error
            }
        },
        [app.syncManager, encryptionMode],
    );

    const handleSyncNow = async () => {
        setIsSyncing(true);
        try {
            await app.syncManager.syncNow();
        } catch (error: any) {
            console.error('Sync failed:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleClearLocalData = async () => {
        if (
            window.confirm(
                'Are you sure you want to clear all local sync data? This will remove cached notes and metadata. Your local files will NOT be deleted.',
            )
        ) {
            try {
                await app.syncManager.localDatabase.clear();
                alert('Local sync data cleared.');
            } catch (error: any) {
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

    const handleLinkWorkspace = async (workspaceId: string) => {
        if (!config?.workspace) return;
        try {
            await app.syncManager.linkWorkspace(config.workspace, workspaceId);
            const allWorkspaces = await app.syncManager.listWorkspaces();
            const linked = allWorkspaces.find((w) => w.id === workspaceId);
            if (linked) {
                setLinkedWorkspace(linked);
            }
            
            // If this was triggered after password confirmation, enable sync now
            if (showWorkspaceSelectionAfterPassword) {
                setShowWorkspaceSelectionAfterPassword(false);
                await app.syncManager.enable();
            }
            
            // Force re-render of sync status
            forceUpdate((v) => v + 1);
        } catch (error: any) {
            console.error('Failed to link workspace:', error);
            alert('Failed to link workspace. Please try again.');
        }
    };

    const handleCreateAndLinkWorkspace = async (name: string) => {
        if (!config?.workspace) return;
        try {
            const newWorkspace = await app.syncManager.createWorkspace(name);
            await app.syncManager.linkWorkspace(config.workspace, newWorkspace.id);
            setLinkedWorkspace(newWorkspace);
            
            // If this was triggered after password confirmation, enable sync now
            if (showWorkspaceSelectionAfterPassword) {
                setShowWorkspaceSelectionAfterPassword(false);
                await app.syncManager.enable();
            }
            
            // Force re-render of sync status
            forceUpdate((v) => v + 1);
        } catch (error: any) {
            console.error('Failed to create and link workspace:', error);
            alert('Failed to create workspace. Please try again.');
        }
    };

    const handleUnlinkWorkspace = async () => {
        if (!config?.workspace) return;
        if (
            window.confirm(
                'Are you sure you want to unlink this folder from the remote workspace? Local files will not be deleted.',
            )
        ) {
            try {
                await app.syncManager.unlinkWorkspace(config.workspace);
                setLinkedWorkspace(null);
                // Force re-render of sync status
                forceUpdate((v) => v + 1);
            } catch (error: any) {
                console.error('Failed to unlink workspace:', error);
                alert('Failed to unlink workspace.');
            }
        }
    };

    // Regular functions (not hooks)

    const handleFontSizeChange = async (size: number) => {
        if (!config) return;

        const newConfig = { ...config, font: { ...config.font, size } };
        await saveConfig(newConfig);

        // Apply to CSS variables immediately
        document.documentElement.style.setProperty('--font-size-base', `${size}px`);
        document.documentElement.style.setProperty('--font-size-editor', `${size}px`);
    };

    const handleFontFamilyChange = async (family: string) => {
        if (!config) return;

        const newConfig = { ...config, font: { ...config.font, family } };
        await saveConfig(newConfig);

        // Apply to CSS variables immediately - both general and monospace for code blocks
        document.documentElement.style.setProperty('--font-family', family);
        document.documentElement.style.setProperty('--font-family-mono', family);
    };

    const handleCustomTitleBarChange = async (useCustom: boolean) => {
        const confirmed = window.confirm(
            'Changing the window style requires restarting the app. The app will close and you need to open it again. Continue?',
        );

        if (!confirmed) return;

        try {
            const changed = await app.windowConfigManager.toggleCustomTitleBar(useCustom);
            if (changed) {
                // Save and close - user needs to manually restart
                const { exit } = await import('@tauri-apps/plugin-process');
                await exit(0);
            }
        } catch (error: any) {
            console.error('Failed to change window style:', error);
        }
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
                if (key?.startsWith('inkdown')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach((key) => {
                localStorage.removeItem(key);
            });
            console.log(`[Settings] Cleared ${keysToRemove.length} localStorage entries`);

            // Clear IndexedDB databases
            const databases = await indexedDB.databases();
            for (const db of databases) {
                if (db.name?.startsWith('inkdown')) {
                    indexedDB.deleteDatabase(db.name);
                    console.log(`[Settings] Deleted IndexedDB: ${db.name}`);
                }
            }

            // Reload the app
            window.location.reload();
        } catch (error: any) {
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
        { id: 'themes', label: 'Themes', icon: <Paintbrush size={16} /> },
        { id: 'editor', label: 'Editor', icon: <Type size={16} /> },
        { id: 'files', label: 'Files', icon: <FolderOpen size={16} /> },
        { id: 'sync', label: 'Sync', icon: <Cloud size={16} /> },
        { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard size={16} /> },
        { id: 'plugins', label: 'Plugins', icon: <Puzzle size={16} /> },
    ];

    // Handler for updating editor config
    const handleEditorConfigChange = async <K extends keyof EditorConfig>(
        key: K,
        value: EditorConfig[K],
    ) => {
        const newConfig = { ...editorConfig, [key]: value };
        setEditorConfig(newConfig);
        try {
            await app.configManager.saveConfig('editor', newConfig);
            // Dispatch custom event to notify App.tsx of config changes
            window.dispatchEvent(
                new CustomEvent('inkdown:editor-config-changed', {
                    detail: newConfig,
                }),
            );
        } catch (error: any) {
            console.error('Failed to save editor config:', error);
        }
    };

    // Handler for updating files config
    const handleFilesConfigChange = async <K extends keyof FilesConfig>(
        key: K,
        value: FilesConfig[K],
    ) => {
        const newConfig = { ...filesConfig, [key]: value };
        setFilesConfig(newConfig);
        try {
            // Use FilesConfigManager to save - this ensures the internal cache is updated
            await app.filesConfigManager.saveConfig(newConfig);
        } catch (error: any) {
            console.error('Failed to save files config:', error);
        }
    };

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
                        <button type="button" className="settings-modal-close" onClick={onClose}>
                            <X size={18} />
                        </button>
                    </div>

                    <div className="settings-modal-body">
                        {/* Sidebar */}
                        <nav className="settings-sidebar">
                            {tabs.map((tab) => (
                                <button
                                    type="button"
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
                                    type="button"
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

                                    <h3>Developer Tools</h3>
                                    <Setting
                                        name="Factory Reset"
                                        description="⚠️ TESTING ONLY: Clears ALL app data (config, cache, sync data, IndexedDB) and redirects to onboarding. Cannot be undone!"
                                    >
                                        <Button
                                            variant="danger"
                                            size="small"
                                            onClick={async () => {
                                                if (
                                                    !window.confirm(
                                                        '⚠️ FACTORY RESET ⚠️\n\nThis will:\n• Delete ALL localStorage data\n• Delete ALL IndexedDB databases\n• Clear sync tokens and encryption keys\n• Return to onboarding\n\nYour local markdown files will NOT be deleted.\n\nContinue?',
                                                    )
                                                ) {
                                                    return;
                                                }

                                                try {
                                                    // 1. Clear ALL localStorage
                                                    localStorage.clear();
                                                    console.log(
                                                        '[FactoryReset] Cleared localStorage',
                                                    );

                                                    // 2. Clear ALL IndexedDB databases
                                                    const databases = await indexedDB.databases();
                                                    for (const db of databases) {
                                                        if (db.name) {
                                                            indexedDB.deleteDatabase(db.name);
                                                            console.log(
                                                                `[FactoryReset] Deleted IndexedDB: ${db.name}`,
                                                            );
                                                        }
                                                    }

                                                    // 3. Clear sessionStorage too
                                                    sessionStorage.clear();
                                                    console.log(
                                                        '[FactoryReset] Cleared sessionStorage',
                                                    );

                                                    // 4. Close modal and reload app (will show onboarding since no config)
                                                    onClose();
                                                    window.location.reload();
                                                } catch (error: any) {
                                                    console.error('[FactoryReset] Failed:', error);
                                                    alert('Factory reset failed. Check console.');
                                                }
                                            }}
                                        >
                                            <Trash2 size={14} />
                                            Factory Reset
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
                                            onChange={(value: number) =>
                                                handleFontSizeChange(value)
                                            }
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
                                            onChange={(value: string) =>
                                                handleFontFamilyChange(value)
                                            }
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

                                    <Setting
                                        name="Custom Title Bar"
                                        description="Use a custom window title bar with integrated controls. Requires app restart."
                                    >
                                        <Toggle
                                            checked={windowConfig.customTitleBar}
                                            onChange={handleCustomTitleBarChange}
                                        />
                                    </Setting>
                                </div>
                            )}

                            {activeTab === 'editor' && (
                                <div className="settings-section">
                                    <h3>Editor Settings</h3>
                                    <p className="settings-description">
                                        Configure how the editor behaves.
                                    </p>

                                    <Setting
                                        name="Auto Pair Brackets"
                                        description="Automatically insert closing brackets, quotes, and parentheses when typing opening ones"
                                    >
                                        <Toggle
                                            checked={editorConfig.autoPairBrackets}
                                            onChange={(checked) =>
                                                handleEditorConfigChange(
                                                    'autoPairBrackets',
                                                    checked,
                                                )
                                            }
                                        />
                                    </Setting>

                                    <Setting
                                        name="Tab Indentation"
                                        description="Use Tab key to indent text. When disabled, Tab will insert a tab character"
                                    >
                                        <Toggle
                                            checked={editorConfig.tabIndentation}
                                            onChange={(checked) =>
                                                handleEditorConfigChange('tabIndentation', checked)
                                            }
                                        />
                                    </Setting>

                                    <Setting
                                        name="Convert Pasted HTML to Markdown"
                                        description="Automatically convert HTML content to Markdown when pasting from clipboard"
                                    >
                                        <Toggle
                                            checked={editorConfig.convertPastedHtmlToMarkdown}
                                            onChange={(checked) =>
                                                handleEditorConfigChange(
                                                    'convertPastedHtmlToMarkdown',
                                                    checked,
                                                )
                                            }
                                        />
                                    </Setting>

                                    <Setting
                                        name="Vim Mode"
                                        description="Enable Vim keybindings for the editor"
                                    >
                                        <Toggle
                                            checked={editorConfig.vimMode}
                                            onChange={(checked) =>
                                                handleEditorConfigChange('vimMode', checked)
                                            }
                                        />
                                    </Setting>

                                    <Setting
                                        name="Show Line Numbers"
                                        description="Display line numbers in the editor gutter"
                                    >
                                        <Toggle
                                            checked={editorConfig.showLineNumbers}
                                            onChange={(checked) =>
                                                handleEditorConfigChange('showLineNumbers', checked)
                                            }
                                        />
                                    </Setting>

                                    <Setting
                                        name="Fold Headings"
                                        description="Enable collapsing/expanding content under markdown headings by clicking the fold indicator"
                                    >
                                        <Toggle
                                            checked={editorConfig.foldHeading}
                                            onChange={(checked) =>
                                                handleEditorConfigChange('foldHeading', checked)
                                            }
                                        />
                                    </Setting>
                                </div>
                            )}

                            {activeTab === 'files' && (
                                <div className="settings-section">
                                    <h3>Files & Folders</h3>
                                    <p className="settings-description">
                                        Configure where new notes and attachments are saved.
                                    </p>

                                    <Setting
                                        name="Default location for new notes"
                                        description="Choose where newly created notes will be saved"
                                    >
                                        <Select
                                            value={filesConfig.newNotesLocation}
                                            onChange={(value: string) =>
                                                handleFilesConfigChange(
                                                    'newNotesLocation',
                                                    value as 'root' | 'folder',
                                                )
                                            }
                                            options={[
                                                { value: 'root', label: 'Workspace root' },
                                                {
                                                    value: 'folder',
                                                    label: 'In folder specified below',
                                                },
                                            ]}
                                        />
                                    </Setting>

                                    {filesConfig.newNotesLocation === 'folder' && (
                                        <Setting
                                            name="Notes folder path"
                                            description="Relative path from workspace root (e.g., 'notes' or 'documents/notes')"
                                        >
                                            <AutocompleteInput
                                                value={filesConfig.newNotesFolder}
                                                onChange={(value) =>
                                                    handleFilesConfigChange('newNotesFolder', value)
                                                }
                                                suggestions={workspaceFolders}
                                                placeholder="notes"
                                            />
                                        </Setting>
                                    )}

                                    <Setting
                                        name="Default location for new attachments"
                                        description="Choose where attachments (images, files) will be saved"
                                    >
                                        <Select
                                            value={filesConfig.newAttachmentsLocation}
                                            onChange={(value: string) =>
                                                handleFilesConfigChange(
                                                    'newAttachmentsLocation',
                                                    value as 'root' | 'folder',
                                                )
                                            }
                                            options={[
                                                { value: 'root', label: 'Workspace root' },
                                                {
                                                    value: 'folder',
                                                    label: 'In folder specified below',
                                                },
                                            ]}
                                        />
                                    </Setting>

                                    {filesConfig.newAttachmentsLocation === 'folder' && (
                                        <Setting
                                            name="Attachments folder path"
                                            description="Relative path from workspace root (e.g., 'attachments' or 'assets/images')"
                                        >
                                            <AutocompleteInput
                                                value={filesConfig.newAttachmentsFolder}
                                                onChange={(value) =>
                                                    handleFilesConfigChange(
                                                        'newAttachmentsFolder',
                                                        value,
                                                    )
                                                }
                                                suggestions={workspaceFolders}
                                                placeholder="attachments"
                                            />
                                        </Setting>
                                    )}
                                </div>
                            )}

                            {activeTab === 'sync' && (
                                <div className="settings-section">
                                    <h3>Sync Settings</h3>
                                    <p className="settings-description">
                                        Synchronize your notes across devices with end-to-end
                                        encryption.
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

                                            <Setting
                                                name="Workspace Link"
                                                description={
                                                    linkedWorkspace
                                                        ? `Linked to workspace: ${linkedWorkspace.name}`
                                                        : 'Link this folder to a remote workspace to sync notes'
                                                }
                                            >
                                                {linkedWorkspace ? (
                                                    <div
                                                        className="workspace-link-actions"
                                                        style={{
                                                            display: 'flex',
                                                            gap: 8,
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <span
                                                            className="workspace-badge"
                                                            style={{
                                                                fontSize: 12,
                                                                padding: '2px 8px',
                                                                background: 'var(--accent-bg)',
                                                                color: 'var(--accent-color)',
                                                                borderRadius: 4,
                                                            }}
                                                        >
                                                            {linkedWorkspace.name}
                                                        </span>
                                                        <Button
                                                            variant="secondary"
                                                            size="small"
                                                            onClick={handleUnlinkWorkspace}
                                                            title="Unlink workspace"
                                                        >
                                                            <Unlink
                                                                size={14}
                                                                style={{ marginRight: 4 }}
                                                            />
                                                            Unlink
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="primary"
                                                        size="small"
                                                        onClick={() => setShowWorkspaceDialog(true)}
                                                    >
                                                        <Link
                                                            size={14}
                                                            style={{ marginRight: 6 }}
                                                        />
                                                        Link Workspace
                                                    </Button>
                                                )}
                                            </Setting>

                                            {isSyncEnabled && (
                                                <Setting
                                                    name="Local Database"
                                                    description="Name of the local cache database (IndexedDB)"
                                                >
                                                    <TextInput
                                                        value={localDbName}
                                                        onChange={(value: string) =>
                                                            setLocalDbName(value)
                                                        }
                                                        onBlur={async () => {
                                                            try {
                                                                await app.syncManager.localDatabase.changeDatabaseName(
                                                                    localDbName,
                                                                );
                                                            } catch (error: any) {
                                                                console.error(
                                                                    'Failed to change database:',
                                                                    error,
                                                                );
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
                                                    <RefreshCw
                                                        size={14}
                                                        className={isSyncing ? 'spin' : ''}
                                                    />
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
                                                            onKeyDown={(e) =>
                                                                e.key === 'Enter' &&
                                                                handleAddPattern()
                                                            }
                                                        />
                                                        <Button
                                                            size="small"
                                                            onClick={handleAddPattern}
                                                        >
                                                            Add
                                                        </Button>
                                                    </div>
                                                    <div className="patterns-container">
                                                        {ignoredPatterns.map((pattern) => (
                                                            <div
                                                                key={pattern}
                                                                className="pattern-item"
                                                            >
                                                                <span>{pattern}</span>
                                                                <button
                                                                    type="button"
                                                                    className="remove-pattern-btn"
                                                                    onClick={() =>
                                                                        handleRemovePattern(pattern)
                                                                    }
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
                                        <Setting name="Account" description="Not logged in">
                                            <Button
                                                variant="primary"
                                                size="small"
                                                onClick={() => {
                                                    onClose();
                                                    onShowLoginScreen?.();
                                                }}
                                            >
                                                Login to Sync →
                                            </Button>
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
                                        Manage your installed plugins. Disable plugins to reduce
                                        memory usage.
                                    </p>
                                    <PluginsSettings />
                                </div>
                            )}

                            {activeTab === 'themes' && (
                                <div className="settings-section settings-section-wide">
                                    <h3>Community Themes</h3>
                                    <ThemesSettings />
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
            {/* Workspace Link Dialog */}
            <WorkspaceLinkDialog
                isOpen={showWorkspaceDialog}
                onClose={() => {
                    setShowWorkspaceDialog(false);
                    // If user cancels workspace selection after password, don't enable sync
                    if (showWorkspaceSelectionAfterPassword) {
                        setShowWorkspaceSelectionAfterPassword(false);
                        // Don't enable sync if no workspace selected
                        forceUpdate((v) => v + 1);
                    }
                }}
                onLink={handleLinkWorkspace}
                onCreateAndLink={handleCreateAndLinkWorkspace}
                listWorkspaces={() => app.syncManager.listWorkspaces()}
                localPath={config?.workspace}
            />
        </>
    );
};
