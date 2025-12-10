/**
 * Community Theme Types
 *
 * Types for the community theme system that allows users to browse,
 * install, and manage themes from the inkdown-community repository.
 */

import type { ColorScheme } from './theme';

/**
 * Theme listing from the community themes.json index
 * This is the minimal info shown in the theme browser
 */
export interface CommunityThemeListing {
    /** Display name of the theme */
    name: string;
    /** Author's username or name */
    author: string;
    /** GitHub repository in format "owner/repo" */
    repo: string;
    /** Screenshot filename (relative to repo) */
    screenshot: string;
    /** Supported color modes */
    modes: ColorScheme[];
}

/**
 * Full theme manifest from manifest.json in each theme repo
 */
export interface CommunityThemeManifest {
    /** Display name of the theme */
    name: string;
    /** Author's username or name */
    author: string;
    /** Theme description */
    description?: string;
    /** Theme version (semver) */
    version: string;
    /** Homepage URL (optional) */
    homepage?: string;
    /** Supported color modes (dark/light) */
    modes: ColorScheme[];
}

/**
 * Full community theme data combining listing and manifest info
 * This is what we cache after fetching full theme details
 */
export interface CommunityTheme {
    /** Listing info from themes.json */
    listing: CommunityThemeListing;
    /** Full manifest from manifest.json */
    manifest: CommunityThemeManifest;
    /** README content (markdown) */
    readme: string;
    /** Screenshot URL (resolved) */
    screenshotUrl: string;
    /** Whether the theme is currently installed */
    installed: boolean;
    /** Installed version if installed */
    installedVersion?: string;
}

/**
 * Cached theme data for persistence
 */
export interface CommunityThemeCache {
    /** Last fetch timestamp */
    lastFetched: number;
    /** Cached theme listings */
    listings: CommunityThemeListing[];
    /** Full theme data (fetched on demand) */
    themes: Record<string, CommunityTheme>;
}

/**
 * Installed theme metadata stored locally
 */
export interface InstalledCommunityTheme {
    /** Theme ID (usually repo name like "l-furquim/inkdown-gruvbox") */
    id: string;
    /** Theme name */
    name: string;
    /** Author */
    author: string;
    /** Installed version */
    version: string;
    /** Install timestamp */
    installedAt: number;
    /** Supported color modes */
    modes: ColorScheme[];
}

/**
 * Config for installed community themes
 */
export interface InstalledThemesConfig {
    /** List of installed themes */
    themes: InstalledCommunityTheme[];
}
