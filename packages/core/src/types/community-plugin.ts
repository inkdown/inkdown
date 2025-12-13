/**
 * Community Plugin Types
 * Types for community plugin discovery, installation, and management
 */

import type { PluginManifest } from './plugin';

/**
 * Extended manifest for community plugins
 * Includes additional fields for discovery and installation
 */
export interface CommunityPluginManifest extends PluginManifest {
    /** GitHub repository in format "owner/repo" */
    repo?: string;
    /** Whether this plugin is desktop-only */
    isDesktopOnly?: boolean;
    /** Directory name where the plugin is installed */
    dir?: string;
}

/**
 * Community plugin listing from the registry
 */
export interface CommunityPluginListing {
    /** Plugin ID */
    id: string;
    /** Display name */
    name: string;
    /** Plugin author */
    author: string;
    /** Brief description */
    description: string;
    /** GitHub repository path (owner/repo) */
    repo: string;
}

/**
 * Full community plugin info with manifest and release details
 */
export interface CommunityPlugin extends CommunityPluginListing {
    /** Full manifest from the repository */
    manifest: CommunityPluginManifest;
    /** Latest version available */
    latestVersion: string;
    /** Release notes/changelog */
    releaseNotes?: string;
    /** README content from repository */
    readme?: string;
    /** Download count (if available) */
    downloads?: number;
    /** Last updated timestamp */
    updatedAt?: number;
    /** Whether this plugin is currently installed */
    installed?: boolean;
    /** Installed version if installed */
    installedVersion?: string;
}

/**
 * Installed community plugin record
 */
export interface InstalledCommunityPlugin {
    /** Plugin ID */
    id: string;
    /** Display name */
    name: string;
    /** Plugin author */
    author: string;
    /** Installed version */
    version: string;
    /** GitHub repository path */
    repo: string;
    /** Installation timestamp */
    installedAt: number;
    /** Whether auto-update is enabled */
    autoUpdate?: boolean;
}

/**
 * Configuration for installed community plugins
 */
export interface InstalledPluginsConfig {
    plugins: InstalledCommunityPlugin[];
}

/**
 * Plugin load result
 */
export interface PluginLoadResult {
    success: boolean;
    pluginId: string;
    error?: string;
}

/**
 * Plugin installation result
 */
export interface PluginInstallResult {
    success: boolean;
    pluginId: string;
    version?: string;
    error?: string;
}

/**
 * Plugin update info
 */
export interface PluginUpdateInfo {
    pluginId: string;
    currentVersion: string;
    latestVersion: string;
    hasUpdate: boolean;
}

/**
 * Community plugin cache structure
 */
export interface CommunityPluginCache {
    /** Last fetch timestamp */
    lastFetched: number;
    /** List of plugin listings */
    listings: CommunityPluginListing[];
    /** Full plugin details cache */
    plugins: Record<string, CommunityPlugin>;
}
