import type { CommunityTheme, CommunityThemeListing } from '@inkdown/core';
import { Button } from '@inkdown/ui';
import {
    ArrowLeft,
    ArrowUpDown,
    Check,
    Download,
    ExternalLink,
    Moon,
    RefreshCw,
    Search,
    Sun,
    Trash2,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Preview } from './Preview';
import './ThemesSettings.css';

/**
 * View state for the themes settings
 */
type ThemeView = 'list' | 'detail';

/**
 * Sort options for theme listing
 */
type SortOption = 'alphabetical' | 'newest';

/**
 * Theme Card Component - Displays a single theme in the listing
 */
const ThemeCard: React.FC<{
    listing: CommunityThemeListing;
    isInstalled: boolean;
    onClick: () => void;
}> = ({ listing, isInstalled, onClick }) => {
    const app = useApp();
    const screenshotUrl = app.communityThemeManager.getScreenshotUrl(listing);
    const [imageError, setImageError] = useState(false);

    return (
        <button type="button" className="theme-card" onClick={onClick}>
            <div className="theme-card-screenshot">
                {imageError ? (
                    <div className="theme-card-screenshot-placeholder">
                        <span>{listing.name[0]}</span>
                    </div>
                ) : (
                    <img
                        src={screenshotUrl}
                        alt={`${listing.name} theme preview`}
                        onError={() => setImageError(true)}
                    />
                )}
                {isInstalled && <div className="theme-card-installed-badge">Installed</div>}
            </div>
            <div className="theme-card-info">
                <h4 className="theme-card-name">{listing.name}</h4>
                <span className="theme-card-author">by {listing.author}</span>
                <div className="theme-card-modes">
                    {listing.modes.includes('dark') && (
                        <span className="theme-mode-badge theme-mode-dark">
                            <Moon size={12} />
                            Dark
                        </span>
                    )}
                    {listing.modes.includes('light') && (
                        <span className="theme-mode-badge theme-mode-light">
                            <Sun size={12} />
                            Light
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
};

/**
 * Theme Detail Component - Shows full theme details with install/uninstall
 */
const ThemeDetail: React.FC<{
    listing: CommunityThemeListing;
    onBack: () => void;
}> = ({ listing, onBack }) => {
    const app = useApp();
    const [theme, setTheme] = useState<CommunityTheme | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [installing, setInstalling] = useState(false);
    const [uninstalling, setUninstalling] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Fetch full theme details
    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const details = await app.communityThemeManager.getThemeDetails(listing);
                if (details) {
                    setTheme(details);
                } else {
                    setError('Failed to load theme details');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [app.communityThemeManager, listing]);

    const handleInstall = async () => {
        if (!theme) return;
        setInstalling(true);
        try {
            await app.communityThemeManager.installTheme(theme);
            // Refresh theme data
            const updated = await app.communityThemeManager.getThemeDetails(listing);
            if (updated) setTheme(updated);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to install theme');
        } finally {
            setInstalling(false);
        }
    };

    const handleUninstall = async () => {
        if (!theme) return;
        setUninstalling(true);
        try {
            await app.communityThemeManager.uninstallTheme(theme.listing.repo);
            // Refresh theme data
            const updated = await app.communityThemeManager.getThemeDetails(listing);
            if (updated) setTheme(updated);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to uninstall theme');
        } finally {
            setUninstalling(false);
        }
    };

    const handleOpenRepo = () => {
        const url = app.communityThemeManager.getRepoUrl(listing.repo);
        app.openExternalLink(url);
    };

    if (loading) {
        return (
            <div className="theme-detail">
                <div className="theme-detail-header">
                    <button type="button" className="theme-detail-back" onClick={onBack}>
                        <ArrowLeft size={18} />
                        <span>Back to themes</span>
                    </button>
                </div>
                <div className="theme-detail-loading">
                    <RefreshCw size={24} className="spin" />
                    <span>Loading theme details...</span>
                </div>
            </div>
        );
    }

    if (error || !theme) {
        return (
            <div className="theme-detail">
                <div className="theme-detail-header">
                    <button type="button" className="theme-detail-back" onClick={onBack}>
                        <ArrowLeft size={18} />
                        <span>Back to themes</span>
                    </button>
                </div>
                <div className="theme-detail-error">
                    <p>{error || 'Failed to load theme details'}</p>
                    <Button variant="secondary" onClick={onBack}>
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="theme-detail">
            <div className="theme-detail-header">
                <button type="button" className="theme-detail-back" onClick={onBack}>
                    <ArrowLeft size={18} />
                    <span>Back to themes</span>
                </button>
            </div>

            <div className="theme-detail-content">
                {/* Theme Info Section */}
                <div className="theme-detail-info">
                    <div className="theme-detail-screenshot">
                        {imageError ? (
                            <div className="theme-card-screenshot-placeholder large">
                                <span>{theme.manifest.name[0]}</span>
                            </div>
                        ) : (
                            <img
                                src={theme.screenshotUrl}
                                alt={`${theme.manifest.name} theme preview`}
                                onError={() => setImageError(true)}
                            />
                        )}
                    </div>

                    <div className="theme-detail-meta">
                        <h2 className="theme-detail-name">{theme.manifest.name}</h2>
                        <p className="theme-detail-author">by {theme.manifest.author}</p>

                        {theme.manifest.description && (
                            <p className="theme-detail-description">{theme.manifest.description}</p>
                        )}

                        <div className="theme-detail-info-grid">
                            <div className="theme-detail-info-item">
                                <span className="label">Version</span>
                                <span className="value">{theme.manifest.version}</span>
                            </div>
                            <div className="theme-detail-info-item">
                                <span className="label">Status</span>
                                <span className="value">
                                    {theme.installed ? (
                                        <span className="status-installed">
                                            Installed (v{theme.installedVersion})
                                        </span>
                                    ) : (
                                        <span className="status-not-installed">Not installed</span>
                                    )}
                                </span>
                            </div>
                        </div>

                        <div className="theme-detail-variants">
                            <span className="label">Available Modes</span>
                            <div className="theme-detail-variants-list">
                                {(theme.manifest.modes || ['dark']).map((mode) => (
                                    <div key={mode} className="theme-variant-item">
                                        {mode === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                                        <span>{mode === 'dark' ? 'Dark' : 'Light'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="theme-detail-actions">
                            {theme.installed ? (
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
                {theme.readme && (
                    <div className="theme-detail-readme">
                        <div className="theme-detail-readme-content">
                            <Preview content={theme.readme} mode="preview-only" app={app} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * ThemesSettings Component - Main themes browser for settings modal
 */
export const ThemesSettings: React.FC = () => {
    const app = useApp();
    const [view, setView] = useState<ThemeView>('list');
    const [listings, setListings] = useState<CommunityThemeListing[]>([]);
    const [selectedListing, setSelectedListing] = useState<CommunityThemeListing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [installedOnly, setInstalledOnly] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('alphabetical');

    // Fetch theme listings on mount
    const fetchListings = useCallback(
        async (forceRefresh = false) => {
            setLoading(!forceRefresh);
            setRefreshing(forceRefresh);
            setError(null);

            try {
                const themes = await app.communityThemeManager.getThemeListings(forceRefresh);
                setListings(themes);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load themes');
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [app.communityThemeManager],
    );

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
                    listing.author.toLowerCase().includes(query),
            );
        }

        // Filter by installed status
        if (installedOnly) {
            result = result.filter((listing) =>
                app.communityThemeManager.isThemeInstalled(listing.repo),
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
    }, [listings, searchQuery, installedOnly, sortBy, app.communityThemeManager]);

    const handleThemeClick = (listing: CommunityThemeListing) => {
        setSelectedListing(listing);
        setView('detail');
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedListing(null);
        // Refresh listings to update installation status
        fetchListings();
    };

    const handleRefresh = () => {
        fetchListings(true);
    };

    const toggleSort = () => {
        setSortBy((prev) => (prev === 'alphabetical' ? 'newest' : 'alphabetical'));
    };

    // Show detail view if a theme is selected
    if (view === 'detail' && selectedListing) {
        return <ThemeDetail listing={selectedListing} onBack={handleBackToList} />;
    }

    // Show loading state
    if (loading) {
        return (
            <div className="themes-settings">
                <div className="themes-settings-loading">
                    <RefreshCw size={24} className="spin" />
                    <span>Loading community themes...</span>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="themes-settings">
                <div className="themes-settings-error">
                    <p>{error}</p>
                    <Button variant="secondary" onClick={() => fetchListings()}>
                        <RefreshCw size={14} />
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    // Show empty state
    if (listings.length === 0) {
        return (
            <div className="themes-settings">
                <div className="themes-settings-empty">
                    <p>No community themes available yet.</p>
                    <Button variant="secondary" onClick={handleRefresh}>
                        <RefreshCw size={14} />
                        Refresh
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="themes-settings">
            <div className="themes-settings-header">
                <p className="themes-settings-description">
                    Browse and install community themes to customize Inkdown's appearance.
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
            <div className="themes-toolbar">
                <div className="themes-search">
                    <Search size={16} className="themes-search-icon" />
                    <input
                        type="text"
                        className="themes-search-input"
                        placeholder="Search themes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="themes-filters">
                    <button
                        type="button"
                        className={`themes-filter-btn ${installedOnly ? 'active' : ''}`}
                        onClick={() => setInstalledOnly(!installedOnly)}
                    >
                        <Check size={14} />
                        Installed
                    </button>
                    <button type="button" className="themes-filter-btn" onClick={toggleSort}>
                        <ArrowUpDown size={14} />
                        {sortBy === 'alphabetical' ? 'A-Z' : 'Newest'}
                    </button>
                </div>
            </div>

            {/* Results count */}
            {searchQuery || installedOnly ? (
                <p className="themes-results-count">
                    {filteredListings.length} theme{filteredListings.length !== 1 ? 's' : ''} found
                </p>
            ) : null}

            {/* Empty filtered state */}
            {filteredListings.length === 0 ? (
                <div className="themes-settings-empty">
                    <p>No themes match your filters.</p>
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
                <div className="themes-grid">
                    {filteredListings.map((listing) => (
                        <ThemeCard
                            key={listing.repo}
                            listing={listing}
                            isInstalled={app.communityThemeManager.isThemeInstalled(listing.repo)}
                            onClick={() => handleThemeClick(listing)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
