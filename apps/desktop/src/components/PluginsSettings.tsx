import type { CommunityPlugin, CommunityPluginListing, Plugin } from '@inkdown/core';
import { Button, Setting, Toggle } from '@inkdown/ui';
import { ArrowLeft, ArrowUpDown, Check, Download, ExternalLink, RefreshCw, Search, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp, usePluginManager } from '../contexts/AppContext';
import { Preview } from './Preview';
import './PluginsSettings.css';

/**
 * View state for the plugins settings
 */
type PluginView = 'list' | 'detail';

/**
 * Tab selection for plugins
 */
type PluginTab = 'installed' | 'library';

/**
 * Sort options for plugin listing
 */
type SortOption = 'alphabetical' | 'newest';

/**
 * Plugin Card Component - Displays a single plugin in the library listing
 */
const PluginCard: React.FC<{
    listing: CommunityPluginListing;
    isInstalled: boolean;
    onClick: () => void;
}> = ({ listing, isInstalled, onClick }) => {
    return (
        <button type="button" className="plugin-card" onClick={onClick}>
            <div className="plugin-card-icon">
                <span>{listing.name[0]}</span>
                {isInstalled && (
                    <div className="plugin-card-installed-badge">
                        <Check size={10} />
                    </div>
                )}
            </div>
            <div className="plugin-card-info">
                <h4 className="plugin-card-name">{listing.name}</h4>
                <span className="plugin-card-author">by {listing.author}</span>
                {listing.description && (
                    <p className="plugin-card-description">{listing.description}</p>
                )}
            </div>
        </button>
    );
};

/**
 * Plugin Detail Component - Shows full plugin details with install/uninstall
 */
const PluginDetail: React.FC<{
    listing: CommunityPluginListing;
    onBack: () => void;
}> = ({ listing, onBack }) => {
    const app = useApp();
    const pluginManager = usePluginManager();
    const [plugin, setPlugin] = useState<CommunityPlugin | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [installing, setInstalling] = useState(false);
    const [uninstalling, setUninstalling] = useState(false);

    // Fetch full plugin details
    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const details = await app.communityPluginManager.getPluginDetails(listing);
                if (details) {
                    setPlugin(details);
                } else {
                    setError('Failed to load plugin details');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [app.communityPluginManager, listing]);

    const handleInstall = async () => {
        if (!plugin) return;
        setInstalling(true);
        try {
            const result = await app.communityPluginManager.installPlugin(plugin);
            if (result.success) {
                // Load the plugin into the plugin manager
                await app.communityPluginManager.loadInstalledPlugin(plugin.manifest.id);
                // Refresh plugin data
                const updated = await app.communityPluginManager.getPluginDetails(listing);
                if (updated) setPlugin(updated);
            } else {
                setError(result.error || 'Failed to install plugin');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to install plugin');
        } finally {
            setInstalling(false);
        }
    };

    const handleUninstall = async () => {
        if (!plugin) return;
        setUninstalling(true);
        try {
            // Disable plugin first
            await pluginManager.disablePlugin(plugin.manifest.id);
            // Then uninstall
            await app.communityPluginManager.uninstallPlugin(plugin.repo);
            // Refresh plugin data
            const updated = await app.communityPluginManager.getPluginDetails(listing);
            if (updated) setPlugin(updated);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to uninstall plugin');
        } finally {
            setUninstalling(false);
        }
    };

    const handleOpenRepo = () => {
        const url = app.communityPluginManager.getRepoUrl(listing.repo);
        app.openExternalLink(url);
    };

    if (loading) {
        return (
            <div className="plugin-detail">
                <div className="plugin-detail-header">
                    <button type="button" className="plugin-detail-back" onClick={onBack}>
                        <ArrowLeft size={18} />
                        <span>Back to plugins</span>
                    </button>
                </div>
                <div className="plugin-detail-loading">
                    <RefreshCw size={24} className="spin" />
                    <span>Loading plugin details...</span>
                </div>
            </div>
        );
    }

    if (error || !plugin) {
        return (
            <div className="plugin-detail">
                <div className="plugin-detail-header">
                    <button type="button" className="plugin-detail-back" onClick={onBack}>
                        <ArrowLeft size={18} />
                        <span>Back to plugins</span>
                    </button>
                </div>
                <div className="plugin-detail-error">
                    <p>{error || 'Failed to load plugin details'}</p>
                    <Button variant="secondary" onClick={onBack}>
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="plugin-detail">
            <div className="plugin-detail-header">
                <button type="button" className="plugin-detail-back" onClick={onBack}>
                    <ArrowLeft size={18} />
                    <span>Back to plugins</span>
                </button>
            </div>

            <div className="plugin-detail-content">
                {/* Plugin Info Section */}
                <div className="plugin-detail-info">
                    <div className="plugin-detail-icon">
                        <span>{plugin.manifest.name[0]}</span>
                    </div>

                    <div className="plugin-detail-meta">
                        <h2 className="plugin-detail-name">{plugin.manifest.name}</h2>
                        <p className="plugin-detail-author">by {plugin.manifest.author}</p>
                        
                        {plugin.manifest.description && (
                            <p className="plugin-detail-description">{plugin.manifest.description}</p>
                        )}

                        <div className="plugin-detail-info-grid">
                            <div className="plugin-detail-info-item">
                                <span className="label">Version</span>
                                <span className="value">{plugin.manifest.version}</span>
                            </div>
                            <div className="plugin-detail-info-item">
                                <span className="label">Status</span>
                                <span className="value">
                                    {plugin.installed ? (
                                        <span className="status-installed">Installed (v{plugin.installedVersion})</span>
                                    ) : (
                                        <span className="status-not-installed">Not installed</span>
                                    )}
                                </span>
                            </div>
                            {plugin.manifest.minAppVersion && (
                                <div className="plugin-detail-info-item">
                                    <span className="label">Min App Version</span>
                                    <span className="value">{plugin.manifest.minAppVersion}</span>
                                </div>
                            )}
                        </div>

                        <div className="plugin-detail-actions">
                            {plugin.installed ? (
                                <Button
                                    variant="danger"
                                    onClick={handleUninstall}
                                    disabled={uninstalling}
                                >
                                    {uninstalling ? (
                                        <>
                                            <RefreshCw size={14} className="spin" />
                                            Uninstalling...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={14} />
                                            Uninstall
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    onClick={handleInstall}
                                    disabled={installing}
                                >
                                    {installing ? (
                                        <>
                                            <RefreshCw size={14} className="spin" />
                                            Installing...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={14} />
                                            Install
                                        </>
                                    )}
                                </Button>
                            )}
                            <Button variant="secondary" onClick={handleOpenRepo}>
                                <ExternalLink size={14} />
                                View on GitHub
                            </Button>
                        </div>
                    </div>
                </div>

                {/* README Section */}
                {plugin.readme && (
                    <div className="plugin-detail-readme">
                        <div className="plugin-detail-readme-content">
                            <Preview content={plugin.readme} mode="preview-only" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Installed Plugins Tab - Shows all installed plugins with toggles
 */
const InstalledPluginsTab: React.FC = () => {
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
                <p className="plugins-empty-hint">Browse the Library to discover and install plugins.</p>
            </div>
        );
    }

    return (
        <div className="plugins-installed-list">
            {/* Built-in plugins */}
            {builtInPlugins.length > 0 && (
                <>
                    <div className="plugins-section-header">
                        <span>Core Plugins</span>
                    </div>
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
                    <div className="plugins-section-header">
                        <span>Community Plugins</span>
                    </div>
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

/**
 * Library Plugins Tab - Browse community plugins
 */
const LibraryPluginsTab: React.FC<{
    onSelectPlugin: (listing: CommunityPluginListing) => void;
}> = ({ onSelectPlugin }) => {
    const app = useApp();
    const [listings, setListings] = useState<CommunityPluginListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    
    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [installedOnly, setInstalledOnly] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('alphabetical');

    // Fetch plugin listings on mount
    const fetchListings = useCallback(async (forceRefresh = false) => {
        setLoading(!forceRefresh);
        setRefreshing(forceRefresh);
        setError(null);

        try {
            const plugins = await app.communityPluginManager.getPluginListings(forceRefresh);
            setListings(plugins);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load plugins');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [app.communityPluginManager]);

    useEffect(() => {
        fetchListings();
    }, [fetchListings]);

    // Filtered and sorted listings
    const filteredListings = useMemo(() => {
        let result = [...listings];

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (listing) =>
                    listing.name.toLowerCase().includes(query) ||
                    listing.author.toLowerCase().includes(query) ||
                    (listing.description && listing.description.toLowerCase().includes(query))
            );
        }

        // Filter by installed status
        if (installedOnly) {
            result = result.filter((listing) =>
                app.communityPluginManager.isPluginInstalled(listing.repo)
            );
        }

        // Sort
        if (sortBy === 'alphabetical') {
            result.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'newest') {
            // Reverse order (assuming the original order from API is oldest first)
            result.reverse();
        }

        return result;
    }, [listings, searchQuery, installedOnly, sortBy, app.communityPluginManager]);

    const handleRefresh = () => {
        fetchListings(true);
    };

    const toggleSort = () => {
        setSortBy((prev) => (prev === 'alphabetical' ? 'newest' : 'alphabetical'));
    };

    // Show loading state
    if (loading) {
        return (
            <div className="plugins-library-loading">
                <RefreshCw size={24} className="spin" />
                <span>Loading community plugins...</span>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="plugins-library-error">
                <p>{error}</p>
                <Button variant="secondary" onClick={() => fetchListings()}>
                    <RefreshCw size={14} />
                    Try Again
                </Button>
            </div>
        );
    }

    // Show empty state
    if (listings.length === 0) {
        return (
            <div className="plugins-library-empty">
                <p>No community plugins available yet.</p>
                <Button variant="secondary" onClick={handleRefresh}>
                    <RefreshCw size={14} />
                    Refresh
                </Button>
            </div>
        );
    }

    return (
        <div className="plugins-library">
            <div className="plugins-library-header">
                <p className="plugins-library-description">
                    Browse and install community plugins to extend Inkdown's functionality.
                </p>
                <Button
                    variant="secondary"
                    size="small"
                    onClick={handleRefresh}
                    disabled={refreshing}
                >
                    <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="plugins-toolbar">
                <div className="plugins-search">
                    <Search size={16} className="plugins-search-icon" />
                    <input
                        type="text"
                        className="plugins-search-input"
                        placeholder="Search plugins..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="plugins-filters">
                    <button
                        type="button"
                        className={`plugins-filter-btn ${installedOnly ? 'active' : ''}`}
                        onClick={() => setInstalledOnly(!installedOnly)}
                    >
                        <Check size={14} />
                        Installed
                    </button>
                    <button
                        type="button"
                        className="plugins-filter-btn"
                        onClick={toggleSort}
                    >
                        <ArrowUpDown size={14} />
                        {sortBy === 'alphabetical' ? 'A-Z' : 'Newest'}
                    </button>
                </div>
            </div>

            {/* Results count */}
            {searchQuery || installedOnly ? (
                <p className="plugins-results-count">
                    {filteredListings.length} plugin{filteredListings.length !== 1 ? 's' : ''} found
                </p>
            ) : null}

            {/* Empty filtered state */}
            {filteredListings.length === 0 ? (
                <div className="plugins-library-empty">
                    <p>No plugins match your filters.</p>
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={() => {
                            setSearchQuery('');
                            setInstalledOnly(false);
                        }}
                    >
                        Clear Filters
                    </Button>
                </div>
            ) : (
                <div className="plugins-grid">
                    {filteredListings.map((listing) => (
                        <PluginCard
                            key={listing.repo}
                            listing={listing}
                            isInstalled={app.communityPluginManager.isPluginInstalled(listing.repo)}
                            onClick={() => onSelectPlugin(listing)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * PluginsSettings Component - Main plugins settings with tabs
 */
export const PluginsSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<PluginTab>('installed');
    const [view, setView] = useState<PluginView>('list');
    const [selectedListing, setSelectedListing] = useState<CommunityPluginListing | null>(null);

    const handleSelectPlugin = (listing: CommunityPluginListing) => {
        setSelectedListing(listing);
        setView('detail');
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedListing(null);
    };

    // Show detail view if a plugin is selected
    if (view === 'detail' && selectedListing) {
        return <PluginDetail listing={selectedListing} onBack={handleBackToList} />;
    }

    return (
        <div className="plugins-settings">
            {/* Tab Navigation */}
            <div className="plugins-tabs">
                <button
                    type="button"
                    className={`plugins-tab ${activeTab === 'installed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('installed')}
                >
                    Installed
                </button>
                <button
                    type="button"
                    className={`plugins-tab ${activeTab === 'library' ? 'active' : ''}`}
                    onClick={() => setActiveTab('library')}
                >
                    Library
                </button>
            </div>

            {/* Tab Content */}
            <div className="plugins-tab-content">
                {activeTab === 'installed' ? (
                    <InstalledPluginsTab />
                ) : (
                    <LibraryPluginsTab onSelectPlugin={handleSelectPlugin} />
                )}
            </div>
        </div>
    );
};
