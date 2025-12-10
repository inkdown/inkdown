import type { App, RecentWorkspace } from '@inkdown/core';
import { useCallback, useEffect, useState } from 'react';

interface AppConfig {
    workspace?: string;
    expandedDirs?: string[];
    sidebarWidth?: number;
    sidebarCollapsed?: boolean;
    viewMode?: string;
    sortOrder?: string;
    recentWorkspaces?: RecentWorkspace[];
    [key: string]: any;
}

export const useWorkspace = (app: App) => {
    const [rootPath, setRootPath] = useState<string>('');
    const [recentWorkspaces, setRecentWorkspaces] = useState<RecentWorkspace[]>([]);
    const [loading, setLoading] = useState(true);

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
            } catch (error: any) {
                console.error('Failed to load workspace:', error);
            } finally {
                setLoading(false);
            }
        };
        initWorkspace();
    }, [app]);

    const handleWorkspaceSelected = useCallback(
        async (path: string) => {
            setRootPath(path);
            app.fileSystemManager.setWorkspacePath(path);

            // Save to config
            const config = await app.configManager.loadConfig<AppConfig>('app');
            config.workspace = path;

            // Update recent workspaces
            const now = Date.now();
            let recent = config.recentWorkspaces || [];

            // Remove if already exists
            recent = recent.filter((w) => w.path !== path);

            // Add to front
            recent.unshift({
                path,
                name: path.split('/').pop() || path,
                lastOpened: now,
            });

            // Keep only last 10
            recent = recent.slice(0, 10);

            config.recentWorkspaces = recent;
            await app.configManager.saveConfig('app', config);
            setRecentWorkspaces(recent);
        },
        [app],
    );

    return {
        rootPath,
        recentWorkspaces,
        loading,
        setRootPath,
        handleWorkspaceSelected,
    };
};
