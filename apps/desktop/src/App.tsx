import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './components/EditorModes.css';
import type { FileNode, RecentWorkspace, SyncConfig } from '@inkdown/core';
import { OnboardingScreen, WorkspaceHistory } from '@inkdown/core';
import { EmptyTabView, Preview, StatusBar, TabBar, WorkspaceSelector, WorkspaceLinkDialog } from '@inkdown/ui';
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { ask, open as openDialog } from '@tauri-apps/plugin-dialog';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import type { SelectedItem, SortOrder } from './components/FileExplorer';
import { FileExplorer } from './components/FileExplorer';
import { SettingsModal } from './components/SettingsModal';
import { useEditorState } from './hooks/useEditorState';
import { useFontSettings } from './hooks/useFontSettings';
import { useTabManager } from './hooks/useTabManager';
import { useWindowState } from './hooks/useWindowState';
import './styles/FileExplorer.css';
import { Editor, registerEditorCommands, DEFAULT_EDITOR_CONFIG } from '@inkdown/core';
import type { EditorConfig } from '@inkdown/core';
import { EditorOptionsMenu, type ViewMode } from './components/EditorOptionsMenu';
import { MoveToModal } from './components/MoveToModal';
import { RenameModal } from './components/RenameModal';
import { SyncStatus } from './components/SyncStatus';
import { WindowControls } from './components/WindowControls';
import { BookmarkGroupModal } from './components/BookmarkGroupModal';

const DEFAULT_SIDEBAR_WIDTH = 250;

interface AppConfig {
    workspace?: string;
    expandedDirs?: string[];
    sidebarWidth?: number;
    sidebarCollapsed?: boolean;
    viewMode?: ViewMode;
    sortOrder?: SortOrder;
    [key: string]: any; // Allow other properties
}

const AppContent: React.FC = () => {
    const { openTab, getActiveTab, activeTabId, tabs, closeTab, setActiveTab } = useTabManager();
    const app = useApp();
    const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
    const [rootPath, setRootPath] = useState<string>('');
    const [files, setFiles] = useState<FileNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [expandedDirs, setExpandedDirs] = useState<string[]>([]);
    const [sidebarWidth, setSidebarWidth] = useState<number>(DEFAULT_SIDEBAR_WIDTH);
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
    const [sortOrder, setSortOrder] = useState<SortOrder>('a-z');
    const [recentWorkspaces, setRecentWorkspaces] = useState<RecentWorkspace[]>([]);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);
    const [editorConfig, setEditorConfig] = useState<EditorConfig>(DEFAULT_EDITOR_CONFIG);
    const [useCustomTitleBar, setUseCustomTitleBar] = useState<boolean>(false);
    const [bookmarkModalOpen, setBookmarkModalOpen] = useState(false);
    const [bookmarkFilePath, setBookmarkFilePath] = useState<string>('');
    const [bookmarkFileName, setBookmarkFileName] = useState<string>('');
    const [showWorkspaceLinkDialog, setShowWorkspaceLinkDialog] = useState(false);

    // Initialize font settings from config/localStorage
    useFontSettings();

    // Initialize window state persistence (save/restore size and position)
    useWindowState(app);

    // Load window configuration (must load early for title bar)
    useEffect(() => {
        const loadWindowConfig = async () => {
            try {
                const config = await app.windowConfigManager.loadConfig();
                setUseCustomTitleBar(config.customTitleBar);
            } catch (error) {
                console.error('Failed to load window config:', error);
            }
        };
        loadWindowConfig();
    }, [app]);

    // Load editor configuration
    useEffect(() => {
        const loadEditorConfig = async () => {
            try {
                const config = await app.configManager.loadConfig<EditorConfig>('editor');
                if (config) {
                    setEditorConfig(config);
                }
            } catch (error) {
                console.error('Failed to load editor config:', error);
            }
        };
        loadEditorConfig();

        // Listen for config changes from settings modal
        const handleConfigChange = (e: CustomEvent<EditorConfig>) => {
            setEditorConfig(e.detail);
        };
        window.addEventListener('inkdown:editor-config-changed', handleConfigChange as EventListener);
        return () => {
            window.removeEventListener('inkdown:editor-config-changed', handleConfigChange as EventListener);
        };
    }, [app]);

    // Get active tab
    const activeTab = getActiveTab();

    // Use EditorStateManager via hook for content management
    const {
        content: editorContent,
        isLoading: isLoadingContent,
        updateContent,
        saveNow,
    } = useEditorState(activeTab?.filePath);

    // Load workspace from config
    useEffect(() => {
        const initWorkspace = async () => {
            try {
                const config = await app.configManager.loadConfig<AppConfig>('app');
                const workspace = config?.workspace;

                if (workspace) {
                    // Verify workspace still exists
                    const exists = await app.fileSystemManager.exists(workspace);
                    if (exists) {
                        setRootPath(workspace);
                        // Sync workspace path to core
                        app.fileSystemManager.setWorkspacePath(workspace);

                        // Load expanded dirs from config
                        if (config?.expandedDirs) {
                            setExpandedDirs(config.expandedDirs);
                        }
                    }
                }

                // Load recent workspaces and validate they still exist
                if (config?.recentWorkspaces) {
                    const validated: RecentWorkspace[] = [];
                    for (const ws of config.recentWorkspaces) {
                        const exists = await app.fileSystemManager.exists(ws.path);
                        if (exists) {
                            validated.push(ws);
                        }
                    }
                    setRecentWorkspaces(validated);

                    // Save cleaned list if any were removed
                    if (validated.length !== config.recentWorkspaces.length) {
                        config.recentWorkspaces = validated;
                        await app.configManager.saveConfig('app', config);
                    }
                }

                // Load sidebar settings
                if (config?.sidebarCollapsed !== undefined) {
                    setSidebarCollapsed(config.sidebarCollapsed);
                }
                if (config?.sidebarWidth) {
                    setSidebarWidth(config.sidebarWidth);
                }

                // Load view mode
                if (config?.viewMode) {
                    setViewMode(config.viewMode as ViewMode);
                }

                // Load sort order
                if (config?.sortOrder) {
                    setSortOrder(config.sortOrder);
                }
            } catch (error) {
                console.error('Failed to load workspace:', error);
            } finally {
                setLoading(false);
            }
        };
        initWorkspace();
    }, [app]);

    // Check if onboarding is needed
    useEffect(() => {
        const checkOnboarding = async () => {
            try {
                const syncConfig = await app.configManager.loadConfig<SyncConfig>('sync');
                setNeedsOnboarding(!syncConfig?.onboardingCompleted);
            } catch (error) {
                console.error('Failed to check onboarding:', error);
            }
        };
        if (!loading) {
            checkOnboarding();
        }
    }, [app, loading]);

    // Handler to change view mode and save to config
    const handleViewModeChange = useCallback(
        async (mode: ViewMode) => {
            setViewMode(mode);
            const config = await app.configManager.loadConfig<AppConfig>('app');
            config.viewMode = mode;
            await app.configManager.saveConfig('app', config);
        },
        [app],
    );

    // Handler to change sort order and save to config
    const handleSortOrderChange = useCallback(
        async (order: SortOrder) => {
            setSortOrder(order);
            const config = await app.configManager.loadConfig<AppConfig>('app');
            config.sortOrder = order;
            await app.configManager.saveConfig('app', config);
        },
        [app],
    );

    // Register editor commands with ShortcutManager for settings UI
    useEffect(() => {
        registerEditorCommands(app.shortcutManager);
    }, [app.shortcutManager]);

    // Sync active file to core
    useEffect(() => {
        if (activeTab?.filePath) {
            const file: FileNode = {
                path: activeTab.filePath,
                name: activeTab.filePath.split('/').pop() || '',
                isDirectory: false,
                // We don't have full stat here, but that's okay for basic usage
            };

            // We need to cast to TFile because FileNode and TFile are slightly different
            // In a real app we would fetch the full TFile from workspace cache
            const tFile: any = {
                path: file.path,
                name: file.name,
                basename: file.name.replace(/\.[^/.]+$/, ''),
                extension: file.name.split('.').pop() || '',
                stat: {
                    size: 0,
                    mtime: Date.now(),
                    ctime: Date.now(),
                },
            };

            app.workspaceUI._setActiveFile(tFile);
        } else {
            app.workspaceUI._setActiveFile(null);
        }
    }, [activeTab?.filePath, app]);

    // Register desktop-specific commands only
    useEffect(() => {
        // Register app:open-settings command
        app.shortcutManager.registerCommand(
            {
                id: 'app:open-settings',
                name: 'Open Settings',
                hotkey: ['Mod', ','],
                callback: () => {
                    setSettingsOpen(true);
                },
            },
            'core',
        );

        // Register app:toggle-view-mode command
        app.shortcutManager.registerCommand(
            {
                id: 'app:toggle-view-mode',
                name: 'Toggle View Mode',
                hotkey: ['Mod', 'E'],
                callback: () => {
                    setViewMode((current) => {
                        const modes: ViewMode[] = ['editor', 'side-by-side', 'preview'];
                        const nextIndex = (modes.indexOf(current) + 1) % modes.length;
                        const nextMode = modes[nextIndex];

                        // Persist change
                        app.configManager.loadConfig<AppConfig>('app').then((config) => {
                            config.viewMode = nextMode;
                            app.configManager.saveConfig('app', config);
                        });

                        return nextMode;
                    });
                },
            },
            'core',
        );

        // Register app:toggle-sidebar command
        app.shortcutManager.registerCommand(
            {
                id: 'app:toggle-sidebar',
                name: 'Toggle Sidebar',
                hotkey: ['Mod', '\\'],
                callback: () => {
                    // Use the handler that persists to config
                    setSidebarCollapsed((prev) => {
                        const newValue = !prev;
                        // Persist to config asynchronously
                        app.configManager.loadConfig<AppConfig>('app').then((config) => {
                            config.sidebarCollapsed = newValue;
                            app.configManager.saveConfig('app', config);
                        });
                        return newValue;
                    });
                },
            },
            'core',
        );

        return () => {
            app.shortcutManager.unregisterCommand('app:open-settings');
            app.shortcutManager.unregisterCommand('app:toggle-sidebar');
        };
    }, [app]);

    const handleWorkspaceSelected = async (path: string) => {
        setRootPath(path);

        // Sync workspace path to core
        app.fileSystemManager.setWorkspacePath(path);
        await app.workspace.refreshFileTree();

        // Reset expanded dirs when changing workspace
        setExpandedDirs([]);

        // Add to recent workspaces and save to config
        const config = await app.configManager.loadConfig<AppConfig>('app');
        const updated = WorkspaceHistory.addWorkspace(
            config.recentWorkspaces || [],
            path
        );
        setRecentWorkspaces(updated);
        config.recentWorkspaces = updated;
        config.workspace = path;
        config.expandedDirs = [];
        await app.configManager.saveConfig('app', config);

        // Check if we need to link a remote workspace
        if (app.syncManager.isEnabled()) {
            const currentWorkspaceId = app.syncManager.getCurrentWorkspaceId();
            if (!currentWorkspaceId) {
                setShowWorkspaceLinkDialog(true);
            }
        }
    };

    const handleLinkWorkspace = async (workspaceId: string) => {
        if (!rootPath) return;
        try {
            await app.syncManager.linkWorkspace(rootPath, workspaceId);
            // Force refresh of sync status if needed
        } catch (error) {
            console.error('Failed to link workspace:', error);
            alert('Failed to link workspace. Please try again.');
        }
    };

    const handleCreateAndLinkWorkspace = async (name: string) => {
        if (!rootPath) return;
        try {
            const newWorkspace = await app.syncManager.createWorkspace(name);
            await app.syncManager.linkWorkspace(rootPath, newWorkspace.id);
        } catch (error) {
            console.error('Failed to create and link workspace:', error);
            alert('Failed to create workspace. Please try again.');
        }
    };

    // Handler to persist expanded directories
    const handleExpandedDirsChange = useCallback(
        async (dirs: string[]) => {
            setExpandedDirs(dirs);
            // Save to config (debounced via the config manager's caching)
            const config = await app.configManager.loadConfig<AppConfig>('app');
            config.expandedDirs = dirs;
            await app.configManager.saveConfig('app', config);
        },
        [app],
    );

    // Handler to persist sidebar width
    const handleSidebarWidthChange = useCallback(
        async (width: number) => {
            setSidebarWidth(width);
            // Save to config
            const config = await app.configManager.loadConfig<AppConfig>('app');
            config.sidebarWidth = width;
            await app.configManager.saveConfig('app', config);
        },
        [app],
    );

    // Handler to persist sidebar collapsed state
    const handleSidebarCollapsedChange = useCallback(
        async (collapsed: boolean) => {
            setSidebarCollapsed(collapsed);
            // Save to config
            const config = await app.configManager.loadConfig<AppConfig>('app');
            config.sidebarCollapsed = collapsed;
            await app.configManager.saveConfig('app', config);
        },
        [app],
    );

    const handleFileSelect = async (filePath: string, openInNewTab?: boolean) => {
        // Save current file before switching (if dirty)
        if (activeTab?.filePath) {
            await saveNow();
        }

        await openTab(filePath, {
            openInNewTab: openInNewTab || false,
        });
    };

    const handleEditorChange = useCallback(
        (content: string) => {
            // Update content via EditorStateManager (handles caching + auto-save)
            updateContent(content);

            // Mark tab as dirty in UI
            if (activeTabId) {
                app.tabManager.markTabDirty(activeTabId, true);
            }
        },
        [activeTabId, app, updateContent],
    );

    // File explorer handlers
    const loadFiles = useCallback(async () => {
        if (!rootPath) return;
        try {
            const fileTree = await app.fileSystemManager.readDirectory(rootPath, true);
            setFiles(fileTree);
        } catch (error) {
            console.error('Failed to load files:', error);
        }
    }, [rootPath, app]);

    // Load files when workspace changes
    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    // Listen for file-create events to refresh the file tree
    useEffect(() => {
        const handleFileCreate = () => {
            loadFiles();
        };

        app.workspace.on('file-create', handleFileCreate);

        return () => {
            app.workspace.off('file-create', handleFileCreate);
        };
    }, [app, loadFiles]);

    const handleOpenDialog = useCallback(async (): Promise<string | null> => {
        const selected = await openDialog({
            directory: true,
            multiple: false,
            title: 'Select Workspace Folder',
        });

        // If a directory was selected, switch to it
        if (selected) {
            await handleWorkspaceSelected(selected as string);
        }

        return selected as string | null;
    }, [handleWorkspaceSelected]);

    const handleCreateFile = useCallback(
        async (filePath: string) => {
            try {
                // Create the file with empty content
                await app.fileSystemManager.writeFile(filePath, '');
                await loadFiles();
            } catch (error) {
                console.error('Failed to create file:', error);
            }
        },
        [app, loadFiles],
    );

    const handleCreateDirectory = useCallback(
        async (dirPath: string) => {
            try {
                await app.fileSystemManager.createDirectory(dirPath);
                await loadFiles();
            } catch (error) {
                console.error('Failed to create directory:', error);
            }
        },
        [app, loadFiles],
    );

    const handleRename = useCallback(
        async (oldPath: string, newName: string) => {
            try {
                const file = app.workspace.getAbstractFileByPath(oldPath);
                if (!file) {
                    throw new Error(`File not found: ${oldPath}`);
                }

                const parentDir = oldPath.substring(0, oldPath.lastIndexOf('/'));
                const newPath = `${parentDir}/${newName}`;

                await app.fileManager.renameFile(file, newPath);
                await loadFiles();
            } catch (error) {
                console.error('Failed to rename:', error);
            }
        },
        [app, loadFiles],
    );

    const handleDelete = useCallback(
        async (path: string, _isDirectory: boolean) => {
            try {
                const file = app.workspace.getAbstractFileByPath(path);
                if (file) {
                    await app.fileManager.trashFile(file);
                } else {
                    // Fallback if not in cache
                    await app.fileSystemManager.delete(path);
                }
                await loadFiles();
            } catch (error) {
                console.error('Failed to delete:', error);
            }
        },
        [app, loadFiles],
    );

    const handleDeleteMultiple = useCallback(
        async (paths: Array<{ path: string; isDirectory: boolean }>) => {
            try {
                // Delete in parallel for better performance
                await Promise.all(paths.map(async (item) => {
                    const file = app.workspace.getAbstractFileByPath(item.path);
                    if (file) {
                        await app.fileManager.trashFile(file);
                    } else {
                        await app.fileSystemManager.delete(item.path);
                    }
                }));
                await loadFiles();
            } catch (error) {
                console.error('Failed to delete multiple:', error);
            }
        },
        [app, loadFiles],
    );

    const handleMove = useCallback(
        async (source: string, destination: string) => {
            try {
                await app.fileSystemManager.move(source, destination);
                await loadFiles();
            } catch (error) {
                console.error('Failed to move:', error);
            }
        },
        [app, loadFiles],
    );

    const handleMoveMultiple = useCallback(
        async (sources: string[], destination: string) => {
            try {
                // Move in sequence to avoid conflicts
                for (const source of sources) {
                    await app.fileSystemManager.move(source, destination);
                }
                await loadFiles();
            } catch (error) {
                console.error('Failed to move multiple:', error);
            }
        },
        [app, loadFiles],
    );

    // Handle delete confirmation using native OS dialog
    const handleRequestDeleteConfirm = useCallback(
        async (items: SelectedItem[]): Promise<boolean> => {
            let message: string;
            let title: string;

            if (items.length === 1) {
                const item = items[0];
                title = 'Delete';
                message = `Are you sure you want to delete "${item.name}"?\n\nThis action cannot be undone.`;
            } else {
                title = `Delete ${items.length} Items`;
                const itemNames = items
                    .slice(0, 5)
                    .map((i) => `• ${i.name}`)
                    .join('\n');
                const moreText = items.length > 5 ? `\n...and ${items.length - 5} more` : '';
                message = `Are you sure you want to delete the following items?\n\n${itemNames}${moreText}\n\nThis action cannot be undone.`;
            }

            return await ask(message, {
                title,
                kind: 'warning',
                okLabel: 'Delete',
                cancelLabel: 'Cancel',
            });
        },
        [],
    );

    // Handler for making a copy of a file
    const handleCopyFile = useCallback(
        async (sourcePath: string) => {
            try {
                // Get the parent directory of the source file
                const parentDir = sourcePath.substring(0, sourcePath.lastIndexOf('/'));
                // The backend copy_file command will automatically handle naming with " (copy)" suffix
                await invoke('copy_file', { source: sourcePath, destination: parentDir });
                await loadFiles();
            } catch (error) {
                console.error('Failed to copy file:', error);
            }
        },
        [loadFiles],
    );

    // Handler for copying absolute path to clipboard
    const handleCopyPath = useCallback(async (path: string) => {
        try {
            await writeText(path);
        } catch (error) {
            console.error('Failed to copy path:', error);
        }
    }, []);

    // Handler for copying relative path to clipboard
    const handleCopyRelativePath = useCallback(
        async (path: string) => {
            try {
                const relativePath = path.replace(rootPath + '/', '');
                await writeText(relativePath);
            } catch (error) {
                console.error('Failed to copy relative path:', error);
            }
        },
        [rootPath],
    );

    // Handler for showing file in system explorer
    const handleShowInExplorer = useCallback(async (path: string) => {
        try {
            await revealItemInDir(path);
        } catch (error) {
            console.error('Failed to show in explorer:', error);
        }
    }, []);

    // Handler for toggling sync ignore
    const handleToggleSyncIgnore = useCallback(
        async (path: string, ignored: boolean) => {
            try {
                if (ignored) {
                    await app.syncManager.selectiveSync.addIgnorePath(path);
                } else {
                    await app.syncManager.selectiveSync.removeIgnorePath(path);
                }
                // Force refresh of file explorer to update UI if needed (though state is internal to selectiveSync)
                // We might need a way to trigger re-render of context menu or file nodes if we add visual indicators later
            } catch (error) {
                console.error('Failed to toggle sync ignore:', error);
            }
        },
        [app],
    );

    const isSyncIgnored = useCallback(
        (path: string) => {
            return app.syncManager.selectiveSync.isIgnored(path);
        },
        [app],
    );

    // Handler for move to functionality
    const handleMoveTo = useCallback(
        async (sourcePath: string) => {
            // First, collect all directories from the file tree
            const directories: string[] = [];
            const collectDirectories = (nodes: FileNode[]) => {
                for (const node of nodes) {
                    if (node.isDirectory) {
                        directories.push(node.path);
                        if (node.children) {
                            collectDirectories(node.children);
                        }
                    }
                }
            };
            collectDirectories(files);

            // Show modal to select destination
            const modal = new MoveToModal(
                app,
                sourcePath,
                rootPath,
                directories,
                async (destination: string) => {
                    try {
                        await app.fileSystemManager.move(sourcePath, destination);
                        await loadFiles();
                    } catch (error) {
                        console.error('Failed to move file:', error);
                    }
                },
            );
            modal.open();
        },
        [app, files, rootPath, loadFiles],
    );

    // Save before page unload

    // Save before page unload
    useEffect(() => {
        const handleBeforeUnload = async () => {
            await app.editorStateManager.saveAllDirty();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [app]);

    // Show loading state
    if (loading) {
        return (
            <div className="app-loading">
                <div className="loading-spinner" />
                <p>Loading Inkdown...</p>
            </div>
        );
    }

    // Show onboarding if needed
    if (needsOnboarding) {
        return (
            <OnboardingScreen
                app={app}
                onComplete={() => {
                    setNeedsOnboarding(false);
                }}
            />
        );
    }

    // Show workspace selector if no workspace is set
    if (!rootPath) {
        return (
            <WorkspaceSelector
                onWorkspaceSelected={handleWorkspaceSelected}
                onOpenDialog={handleOpenDialog}
            />
        );
    }

    return (
        <div className={`app-layout ${useCustomTitleBar ? 'with-custom-titlebar' : ''}`}>
            {/* Main workspace container */}
            <div className="app-workspace">
                {/* File Explorer with integrated resize and toggle */}
                <FileExplorer
                    rootPath={rootPath}
                    activeFilePath={activeTab?.filePath || null}
                    files={files}
                    initialExpandedDirs={expandedDirs}
                    onExpandedDirsChange={handleExpandedDirsChange}
                    onFileSelect={handleFileSelect}
                    onCreateFile={handleCreateFile}
                    onCreateDirectory={handleCreateDirectory}
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onDeleteMultiple={handleDeleteMultiple}
                    onMove={handleMove}
                    onMoveMultiple={handleMoveMultiple}
                    onCopyFile={handleCopyFile}
                    onMoveTo={handleMoveTo}
                    onCopyPath={handleCopyPath}
                    onCopyRelativePath={handleCopyRelativePath}
                    onShowInExplorer={handleShowInExplorer}
                    onRequestDeleteConfirm={handleRequestDeleteConfirm}
                    onRefresh={loadFiles}
                    isCollapsed={sidebarCollapsed}
                    width={sidebarWidth}
                    onCollapsedChange={handleSidebarCollapsedChange}
                    onWidthChange={handleSidebarWidthChange}
                    onOpenSettings={() => setSettingsOpen(true)}
                    initialSortOrder={sortOrder}
                    onSortOrderChange={handleSortOrderChange}
                    recentWorkspaces={recentWorkspaces}
                    onWorkspaceSwitch={handleWorkspaceSelected}
                    onBrowseWorkspace={handleOpenDialog}
                    onToggleSyncIgnore={handleToggleSyncIgnore}
                    isSyncIgnored={isSyncIgnored}
                    useCustomTitleBar={useCustomTitleBar}
                />

                {/* Main Content */}
                <div className="app-main">
                    {/* Tab Bar */}
                    <TabBar
                        tabs={tabs}
                        activeTabId={activeTabId}
                        onTabSelect={setActiveTab}
                        onTabClose={closeTab}
                        sidebarCollapsed={sidebarCollapsed}
                        onToggleSidebar={() => handleSidebarCollapsedChange(!sidebarCollapsed)}
                        windowControls={
                            useCustomTitleBar ? (
                                <WindowControls
                                    workspaceName={rootPath ? rootPath.split('/').pop() || 'Inkdown' : 'Inkdown'}
                                />
                            ) : undefined
                        }
                    />

                    {/* Toolbar replaced by EditorOptionsMenu */}
                    {activeTab?.filePath && (
                        <div style={{ position: 'relative' }}>
                            <EditorOptionsMenu
                                viewMode={viewMode}
                                onViewModeChange={handleViewModeChange}
                                onRename={() => {
                                    if (activeTab?.filePath) {
                                        const currentName = activeTab.filePath.split('/').pop() || '';

                                        const modal = new RenameModal(app, currentName, (newName) => {
                                            handleRename(activeTab.filePath!, newName);
                                        });
                                        modal.open();
                                    }
                                }}
                                onAddBookmark={() => {
                                    if (activeTab?.filePath) {
                                        const fileName = activeTab.filePath.split('/').pop() || '';
                                        setBookmarkFilePath(activeTab.filePath);
                                        setBookmarkFileName(fileName);
                                        setBookmarkModalOpen(true);
                                    }
                                }}
                                onDelete={() => {
                                    if (activeTab?.filePath) {
                                        handleRequestDeleteConfirm([
                                            {
                                                path: activeTab.filePath,
                                                name: activeTab.filePath.split('/').pop() || '',
                                                isDirectory: false,
                                            },
                                        ]).then((confirmed) => {
                                            if (confirmed) {
                                                handleDelete(activeTab.filePath!, false);
                                                // Close the tab
                                                closeTab(activeTabId!);
                                            }
                                        });
                                    }
                                }}
                                onMoveTo={() => {
                                    if (activeTab?.filePath) {
                                        handleMoveTo(activeTab.filePath);
                                    }
                                }}
                                onMakeCopy={() => {
                                    if (activeTab?.filePath) {
                                        handleCopyFile(activeTab.filePath);
                                    }
                                }}
                                onCopyPath={() => {
                                    if (activeTab?.filePath) {
                                        handleCopyPath(activeTab.filePath);
                                    }
                                }}
                                onCopyRelativePath={() => {
                                    if (activeTab?.filePath) {
                                        handleCopyRelativePath(activeTab.filePath);
                                    }
                                }}
                                onShowInExplorer={() => {
                                    if (activeTab?.filePath) {
                                        handleShowInExplorer(activeTab.filePath);
                                    }
                                }}
                            />
                        </div>
                    )}

                    {/* Content Area */}
                    <div className="app-content">
                        {activeTab && !activeTab.filePath ? (
                            <EmptyTabView
                                onNewFile={() => openTab('', { openInNewTab: true })}
                                onOpenFile={() => handleFileSelect('', true)}
                            />
                        ) : isLoadingContent ? (
                            <div className="app-loading-content">
                                <div className="loading-spinner" />
                            </div>
                        ) : (
                            <div className={`editor-preview-container mode-${viewMode}`}>
                                {(viewMode === 'editor' || viewMode === 'side-by-side') && (
                                    <Editor
                                        key={activeTab?.filePath || 'no-tab'}
                                        content={editorContent}
                                        onChange={handleEditorChange}
                                        filePath={activeTab?.filePath}
                                        editorRegistry={app.editorRegistry}
                                        shortcutManager={app.shortcutManager}
                                        app={app}
                                        editorConfig={editorConfig}
                                    />
                                )}

                                {(viewMode === 'preview' || viewMode === 'side-by-side') && (
                                    <Preview
                                        content={editorContent}
                                        mode={
                                            viewMode === 'side-by-side'
                                                ? 'side-by-side'
                                                : 'preview-only'
                                        }
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Status Bar */}
                    <StatusBar
                        items={{
                            left: [],
                            right: [],
                        }}
                    >
                        <SyncStatus onLinkWorkspace={() => setShowWorkspaceLinkDialog(true)} />
                    </StatusBar>
                </div>

                {/* Settings Modal */}
                <SettingsModal
                    isOpen={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    onShowLoginScreen={() => setNeedsOnboarding(true)}
                />

                {/* Bookmark Modal */}
                <BookmarkGroupModal
                    isOpen={bookmarkModalOpen}
                    onClose={() => setBookmarkModalOpen(false)}
                    filePath={bookmarkFilePath}
                    fileName={bookmarkFileName}
                />

                {/* Workspace Link Dialog */}
                <WorkspaceLinkDialog
                    isOpen={showWorkspaceLinkDialog}
                    onClose={() => setShowWorkspaceLinkDialog(false)}
                    onLink={handleLinkWorkspace}
                    onCreateAndLink={handleCreateAndLinkWorkspace}
                    listWorkspaces={() => app.syncManager.listWorkspaces()}
                    localPath={rootPath}
                />
            </div>
        </div>
    );
};

function App() {
    return (
        <AppProvider>
            <ThemeProvider>
                <AppContent />
            </ThemeProvider>
        </AppProvider>
    );
}

export default App;
