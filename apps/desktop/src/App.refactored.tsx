import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './components/EditorModes.css';
import type { FileNode } from '@inkdown/core';
import { OnboardingScreen, WorkspaceHistory, registerEditorCommands } from '@inkdown/core';
import { StatusBar, TabBar, WorkspaceSelector } from '@inkdown/ui';
import { FileExplorer } from './components/FileExplorer';
import { SettingsModal } from './components/SettingsModal';
import { EditorOptionsMenu } from './components/EditorOptionsMenu';
import { MoveToModal } from './components/MoveToModal';
import { RenameModal } from './components/RenameModal';
import { SyncStatus } from './components/SyncStatus';
import { WindowControls } from './components/WindowControls';
import { BookmarkGroupModal } from './components/BookmarkGroupModal';
import { EditorArea } from './components/EditorArea';

// Custom hooks
import { useWorkspace } from './hooks/useWorkspace';
import { useSidebarState } from './hooks/useSidebarState';
import { useFileOperations } from './hooks/useFileOperations';
import { useEditorSettings } from './hooks/useEditorSettings';
import { useEditorState } from './hooks/useEditorState';
import { useFontSettings } from './hooks/useFontSettings';
import { useTabManager } from './hooks/useTabManager';
import { useOnboarding, useWindowConfig } from './hooks/useAppSettings';

import './styles/FileExplorer.css';

const AppContent: React.FC = () => {
    const app = useApp();
    const { openTab, getActiveTab, activeTabId, tabs, closeTab, setActiveTab } = useTabManager();
    
    // Core state
    const [files, setFiles] = useState<FileNode[]>([]);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [bookmarkModalOpen, setBookmarkModalOpen] = useState(false);
    const [bookmarkFilePath, setBookmarkFilePath] = useState<string>('');
    const [bookmarkFileName, setBookmarkFileName] = useState<string>('');

    // Custom hooks for organized state management
    const { rootPath, recentWorkspaces, loading, handleWorkspaceSelected } = useWorkspace(app);
    const {
        expandedDirs,
        sidebarWidth,
        sidebarCollapsed,
        sortOrder,
        handleExpandedDirsChange,
        handleSidebarWidthChange,
        handleSidebarCollapsedChange,
        handleSortOrderChange,
    } = useSidebarState(app, loading);
    
    const { viewMode, editorConfig, handleViewModeChange } = useEditorSettings(app);
    const { needsOnboarding } = useOnboarding(app, loading);
    const { useCustomTitleBar } = useWindowConfig(app);
    
    useFontSettings();

    // Get active tab
    const activeTab = getActiveTab();

    // Editor state management
    const {
        content: editorContent,
        isLoading: isLoadingContent,
        updateContent,
        saveNow,
    } = useEditorState(activeTab?.filePath);

    // File operations handlers
    const fileOps = useFileOperations(app, rootPath);

    // File selection handler
    const handleFileSelect = useCallback(
        async (filePath: string, openInNewTab?: boolean) => {
            await openTab(filePath, openInNewTab);
        },
        [openTab]
    );

    // Editor change handler
    const handleEditorChange = useCallback(
        (value: string) => {
            updateContent(value);
        },
        [updateContent]
    );

    // Load files from filesystem
    useEffect(() => {
        if (!rootPath) return;

        const loadFiles = async () => {
            try {
                const loadedFiles = await app.fileSystemManager.readDirectory(rootPath);
                setFiles(loadedFiles);
            } catch (error) {
                console.error('Failed to load files:', error);
            }
        };

        loadFiles();

        // Listen for file system changes
        const handleFileCreate = () => loadFiles();
        const unsubCreate = app.fileSystemManager.on('file-created', handleFileCreate);
        const unsubDelete = app.fileSystemManager.on('file-deleted', handleFileCreate);
        const unsubRename = app.fileSystemManager.on('file-renamed', handleFileCreate);

        return () => {
            unsubCreate.unload();
            unsubDelete.unload();
            unsubRename.unload();
        };
    }, [app, rootPath]);

    // Sync active file to core
    useEffect(() => {
        if (activeTab?.filePath) {
            const file: FileNode = {
                path: activeTab.filePath,
                name: activeTab.filePath.split('/').pop() || '',
                isDirectory: false,
            };

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

    // Register editor commands
    useEffect(() => {
        registerEditorCommands(app.shortcutManager);
    }, [app.shortcutManager]);

    // Register app-specific commands
    useEffect(() => {
        app.shortcutManager.registerCommand(
            {
                id: 'app:open-settings',
                name: 'Open Settings',
                hotkey: ['Mod', ','],
                callback: () => setSettingsOpen(true),
            },
            'core'
        );

        app.shortcutManager.registerCommand(
            {
                id: 'app:toggle-view-mode',
                name: 'Toggle View Mode',
                hotkey: ['Mod', 'E'],
                callback: () => {
                    const modes = ['editor', 'side-by-side', 'preview'] as const;
                    const currentIndex = modes.indexOf(viewMode);
                    const nextMode = modes[(currentIndex + 1) % modes.length];
                    handleViewModeChange(nextMode);
                },
            },
            'core'
        );

        app.shortcutManager.registerCommand(
            {
                id: 'app:toggle-sidebar',
                name: 'Toggle Sidebar',
                hotkey: ['Mod', '\\'],
                callback: () => {
                    handleSidebarCollapsedChange(!sidebarCollapsed);
                },
            },
            'core'
        );
    }, [app, viewMode, sidebarCollapsed, handleViewModeChange, handleSidebarCollapsedChange]);

    // Loading state
    if (loading) {
        return <div className="app-loading">Loading workspace...</div>;
    }

    // Onboarding flow
    if (needsOnboarding && !rootPath) {
        return (
            <OnboardingScreen
                onWorkspaceSelected={handleWorkspaceSelected}
                recentWorkspaces={recentWorkspaces}
                onOpenDialog={fileOps.handleOpenDialog}
            />
        );
    }

    // No workspace selected
    if (!rootPath) {
        return (
            <WorkspaceSelector
                onWorkspaceSelected={handleWorkspaceSelected}
                recentWorkspaces={recentWorkspaces}
                onOpenDialog={fileOps.handleOpenDialog}
            />
        );
    }

    return (
        <div className="app">
            {useCustomTitleBar && (
                <div className="custom-title-bar">
                    <WindowControls />
                </div>
            )}

            <div className="app-layout">
                <FileExplorer
                    rootPath={rootPath}
                    activeFilePath={activeTab?.filePath}
                    files={files}
                    initialExpandedDirs={expandedDirs}
                    onExpandedDirsChange={handleExpandedDirsChange}
                    onFileSelect={handleFileSelect}
                    onCreateFile={fileOps.handleCreateFile}
                    onCreateDirectory={fileOps.handleCreateDirectory}
                    onRename={fileOps.handleRename}
                    onDelete={fileOps.handleDelete}
                    onDeleteMultiple={fileOps.handleDeleteMultiple}
                    onMove={fileOps.handleMove}
                    onMoveMultiple={fileOps.handleMoveMultiple}
                    onCopyFile={fileOps.handleCopyFile}
                    onCopyPath={fileOps.handleCopyPath}
                    onCopyRelativePath={fileOps.handleCopyRelativePath}
                    onShowInExplorer={fileOps.handleShowInExplorer}
                    onRequestDeleteConfirm={fileOps.handleRequestDeleteConfirm}
                    onRefresh={() => app.fileSystemManager.readDirectory(rootPath).then(setFiles)}
                    isCollapsed={sidebarCollapsed}
                    width={sidebarWidth}
                    onCollapsedChange={handleSidebarCollapsedChange}
                    onWidthChange={handleSidebarWidthChange}
                    onOpenSettings={() => setSettingsOpen(true)}
                    initialSortOrder={sortOrder}
                    onSortOrderChange={handleSortOrderChange}
                    recentWorkspaces={recentWorkspaces}
                    onWorkspaceSwitch={handleWorkspaceSelected}
                    onBrowseWorkspace={fileOps.handleOpenDialog}
                    onToggleSyncIgnore={fileOps.handleToggleSyncIgnore}
                    isSyncIgnored={(path) => app.syncService?.isIgnored(path) ?? false}
                />

                <div className="main-content">
                    <TabBar
                        tabs={tabs}
                        activeTabId={activeTabId}
                        onTabClick={setActiveTab}
                        onTabClose={closeTab}
                        windowControls={useCustomTitleBar ? <WindowControls /> : undefined}
                    />

                    {activeTab && (
                        <div className="editor-header">
                            <EditorOptionsMenu
                                viewMode={viewMode}
                                onViewModeChange={handleViewModeChange}
                                onRename={() => {/* TODO */}}
                                onDelete={() => {/* TODO */}}
                                onAddBookmark={() => {
                                    if (activeTab) {
                                        setBookmarkFilePath(activeTab.filePath);
                                        setBookmarkFileName(activeTab.label);
                                        setBookmarkModalOpen(true);
                                    }
                                }}
                            />
                        </div>
                    )}

                    <EditorArea
                        activeTab={activeTab}
                        editorContent={editorContent}
                        viewMode={viewMode}
                        editorConfig={editorConfig}
                        isLoadingContent={isLoadingContent}
                        onEditorChange={handleEditorChange}
                        onSave={saveNow}
                    />

                    <StatusBar
                        activeFile={activeTab?.filePath || null}
                        wordCount={editorContent.split(/\s+/).filter(Boolean).length}
                        characterCount={editorContent.length}
                        syncStatus={<SyncStatus />}
                    />
                </div>
            </div>

            {settingsOpen && (
                <SettingsModal onClose={() => setSettingsOpen(false)} />
            )}

            <BookmarkGroupModal
                isOpen={bookmarkModalOpen}
                onClose={() => setBookmarkModalOpen(false)}
                filePath={bookmarkFilePath}
                fileName={bookmarkFileName}
            />

            <MoveToModal />
            <RenameModal />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <ThemeProvider>
                <AppContent />
            </ThemeProvider>
        </AppProvider>
    );
};

export default App;
