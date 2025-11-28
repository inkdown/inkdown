import type { Plugin } from '@inkdown/core';
import { Setting, Toggle } from '@inkdown/ui';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { usePluginManager } from '../contexts/AppContext';
import './PluginsSettings.css';

/**
 * Plugins settings panel - displays and manages all plugins
 * Uses a simple list with Toggle components
 */
export const PluginsSettings: React.FC = () => {
    const pluginManager = usePluginManager();
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [, setRefresh] = useState(0);

    // Load plugins
    useEffect(() => {
        setPlugins([...pluginManager.getAllPlugins()]);
    }, [pluginManager]);

    // Handle plugin toggle
    const handleToggle = useCallback(
        async (pluginId: string, enabled: boolean) => {
            if (enabled) {
                await pluginManager.enablePlugin(pluginId);
            } else {
                await pluginManager.disablePlugin(pluginId);
            }
            // Force re-render
            setPlugins([...pluginManager.getAllPlugins()]);
            setRefresh((prev) => prev + 1);
        },
        [pluginManager],
    );

    // Separate built-in and community plugins
    const builtInPlugins = plugins.filter((p) => pluginManager.isBuiltIn(p.manifest.id));
    const communityPlugins = plugins.filter((p) => !pluginManager.isBuiltIn(p.manifest.id));

    if (plugins.length === 0) {
        return (
            <div className="plugins-empty">
                <p>No plugins installed yet.</p>
            </div>
        );
    }

    return (
        <div className="plugins-settings">
            {/* Built-in plugins */}
            {builtInPlugins.length > 0 && (
                <>
                    {builtInPlugins.map((plugin) => (
                        <Setting
                            key={plugin.manifest.id}
                            name={
                                <div className="plugin-name-container">
                                    <span>{plugin.manifest.name}</span>
                                    <span className="plugin-badge plugin-badge-core">Core</span>
                                </div>
                            }
                            description={plugin.manifest.description}
                        >
                            <Toggle
                                checked={plugin.enabled}
                                onChange={(checked) => handleToggle(plugin.manifest.id, checked)}
                            />
                        </Setting>
                    ))}
                </>
            )}

            {/* Community plugins */}
            {communityPlugins.length > 0 && (
                <>
                    {builtInPlugins.length > 0 && (
                        <div className="plugins-section-divider">
                            <span>Community Plugins</span>
                        </div>
                    )}
                    {communityPlugins.map((plugin) => (
                        <Setting
                            key={plugin.manifest.id}
                            name={
                                <div className="plugin-name-container">
                                    <span>{plugin.manifest.name}</span>
                                    <span className="plugin-badge plugin-badge-community">
                                        Community
                                    </span>
                                </div>
                            }
                            description={plugin.manifest.description}
                        >
                            <Toggle
                                checked={plugin.enabled}
                                onChange={(checked) => handleToggle(plugin.manifest.id, checked)}
                            />
                        </Setting>
                    ))}
                </>
            )}
        </div>
    );
};
