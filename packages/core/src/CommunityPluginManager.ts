/**
 * CommunityPluginManager
 * Manages discovery, installation, and updating of community plugins
 *
 * Community plugins are JavaScript bundles that follow the Inkdown plugin API.
 * They are loaded dynamically from the user's config directory.
 *
 * Directory structure:
 * ~/Library/Application Support/com.furqas.inkdown/
 * └── plugins/
 *     └── plugin-id/
 *         ├── manifest.json    # Plugin manifest
 *         ├── main.js          # Plugin bundle (esbuild/webpack output)
 *         └── styles.css       # Optional styles
 */

import type { App } from './App';
import { Component } from './Component';
import { EditorSuggest } from './components/EditorSuggest';
import { FuzzySuggestModal, PopoverSuggest } from './components/FuzzySuggestModal';
import { ConfirmModal, Modal } from './components/Modal';
import { Notice } from './components/Notice';
import { PluginSettingTab } from './components/PluginSettingTab';
import { Setting } from './components/Setting';
import { native } from './native';
// Import core exports for plugin API
import { Plugin } from './Plugin';
import type {
    CommunityPlugin,
    CommunityPluginCache,
    CommunityPluginListing,
    CommunityPluginManifest,
    InstalledCommunityPlugin,
    InstalledPluginsConfig,
    PluginInstallResult,
    PluginUpdateInfo,
} from './types/community-plugin';
import { createLogger } from './utils/logger';
import { ItemView } from './views/ItemView';

// Cache TTL in milliseconds (1 hour)
const CACHE_TTL = 60 * 60 * 1000;

// GitHub raw content URL base
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';
const GITHUB_API_BASE = 'https://api.github.com';

// Community plugins registry URL
// This would be hosted in a public repository
const COMMUNITY_REGISTRY_URL =
    'https://raw.githubusercontent.com/inkdown-app/community-plugins/main/community-plugins.json';

/**
 * CommunityPluginManager - Handles community plugin discovery and installation
 */
export class CommunityPluginManager {
    private app: App;
    private logger = createLogger('CommunityPluginManager');
    private cache: CommunityPluginCache = {
        lastFetched: 0,
        listings: [],
        plugins: {},
    };
    private installedPlugins: Map<string, InstalledCommunityPlugin> = new Map();
    private pluginsDir = '';

    constructor(app: App) {
        this.app = app;
    }

    /**
     * Initialize the community plugin manager
     */
    async init(): Promise<void> {
        try {
            // Get plugins directory from config
            const configDir = await native.config.getConfigDir();
            this.pluginsDir = `${configDir}/plugins`;

            // Ensure plugins directory exists
            await this.ensurePluginsDir();

            // Load installed plugins config
            await this.loadInstalledPlugins();

            this.logger.info(`Community plugins directory: ${this.pluginsDir}`);
            this.logger.info(`Installed community plugins: ${this.installedPlugins.size}`);
        } catch (error: any) {
            this.logger.error('Failed to initialize CommunityPluginManager', error);
        }
    }

    /**
     * Ensure the plugins directory exists
     */
    private async ensurePluginsDir(): Promise<void> {
        try {
            await native.fs.ensureDir(this.pluginsDir);
        } catch (error: any) {
            this.logger.error('Failed to create plugins directory', error);
        }
    }

    /**
     * Load installed plugins configuration
     */
    private async loadInstalledPlugins(): Promise<void> {
        try {
            const config =
                await this.app.configManager.loadConfig<InstalledPluginsConfig>(
                    'installed-plugins',
                );
            if (config?.plugins) {
                for (const plugin of config.plugins) {
                    this.installedPlugins.set(plugin.id, plugin);
                }
            }
        } catch (_error) {
            this.logger.debug('No installed plugins config found');
        }
    }

    /**
     * Save installed plugins configuration
     */
    private async saveInstalledPlugins(): Promise<void> {
        const config: InstalledPluginsConfig = {
            plugins: Array.from(this.installedPlugins.values()),
        };
        await this.app.configManager.saveConfig('installed-plugins', config);
    }

    /**
     * Fetch community plugin listings from registry
     */
    async fetchPluginListings(forceRefresh = false): Promise<CommunityPluginListing[]> {
        // Check cache validity
        if (!forceRefresh && this.isCacheValid()) {
            return this.cache.listings;
        }

        try {
            this.logger.info('Fetching community plugins from registry...');

            const response = await fetch(COMMUNITY_REGISTRY_URL);
            if (!response.ok) {
                throw new Error(`Failed to fetch registry: ${response.status}`);
            }

            const listings: CommunityPluginListing[] = await response.json();
            this.cache.listings = listings;
            this.cache.lastFetched = Date.now();

            this.logger.info(`Fetched ${listings.length} community plugins`);
            return listings;
        } catch (error: any) {
            this.logger.error('Failed to fetch plugin listings', error);
            // Return cached data if available
            return this.cache.listings;
        }
    }

    /**
     * Get full plugin details from GitHub
     */
    async getPluginDetails(listing: CommunityPluginListing): Promise<CommunityPlugin | null> {
        // Check cache
        if (this.cache.plugins[listing.id]) {
            const cached = this.cache.plugins[listing.id];
            // Update installation status
            cached.installed = this.isPluginInstalled(listing.id);
            cached.installedVersion = this.getInstalledVersion(listing.id);
            return cached;
        }

        try {
            const { repo } = listing;

            // Fetch manifest.json from the repository's main branch
            const manifestUrl = `${GITHUB_RAW_BASE}/${repo}/main/manifest.json`;
            const manifestResponse = await fetch(manifestUrl);
            if (!manifestResponse.ok) {
                // Try HEAD as fallback
                const manifestUrlHead = `${GITHUB_RAW_BASE}/${repo}/HEAD/manifest.json`;
                const manifestResponseHead = await fetch(manifestUrlHead);
                if (!manifestResponseHead.ok) {
                    throw new Error(`Failed to fetch manifest: ${manifestResponse.status}`);
                }
            }
            const manifest: CommunityPluginManifest = await manifestResponse.json();

            // Fetch README
            let readme = '';
            try {
                const readmeUrl = `${GITHUB_RAW_BASE}/${repo}/main/README.md`;
                const readmeResponse = await fetch(readmeUrl);
                if (readmeResponse.ok) {
                    readme = await readmeResponse.text();
                }
            } catch {
                this.logger.debug(`No README found for ${listing.id}`);
            }

            // Get release info from GitHub API
            let latestVersion = manifest.version;
            let updatedAt: number | undefined;

            try {
                const releaseUrl = `${GITHUB_API_BASE}/repos/${repo}/releases/latest`;
                const releaseResponse = await fetch(releaseUrl);
                if (releaseResponse.ok) {
                    const release = await releaseResponse.json();
                    latestVersion = release.tag_name?.replace(/^v/, '') || manifest.version;
                    updatedAt = new Date(release.published_at).getTime();
                }
            } catch {
                // Use manifest version if release fetch fails
            }

            const plugin: CommunityPlugin = {
                ...listing,
                manifest,
                latestVersion,
                updatedAt,
                readme,
                installed: this.isPluginInstalled(listing.id),
                installedVersion: this.getInstalledVersion(listing.id),
            };

            // Cache the result
            this.cache.plugins[listing.id] = plugin;
            return plugin;
        } catch (error: any) {
            this.logger.error(`Failed to get details for plugin ${listing.id}`, error);
            return null;
        }
    }

    /**
     * Install a community plugin
     */
    async installPlugin(plugin: CommunityPlugin): Promise<PluginInstallResult> {
        const { id, repo, latestVersion } = plugin;
        this.logger.info(`Installing plugin ${id} v${latestVersion} from ${repo}...`);

        try {
            const pluginDir = `${this.pluginsDir}/${id}`;

            // Create plugin directory
            await native.fs.ensureDir(pluginDir);

            // Fetch and save plugin files from latest release
            const releaseUrl = `${GITHUB_API_BASE}/repos/${repo}/releases/latest`;
            const releaseResponse = await fetch(releaseUrl);

            if (!releaseResponse.ok) {
                throw new Error('Failed to fetch release info');
            }

            const release = await releaseResponse.json();
            const assets = release.assets || [];

            // Download required files
            const requiredFiles = ['main.js', 'manifest.json'];
            const optionalFiles = ['styles.css'];

            for (const fileName of [...requiredFiles, ...optionalFiles]) {
                const asset = assets.find((a: any) => a.name === fileName);

                if (asset) {
                    // Download from release asset
                    const content = await this.downloadAsset(asset.browser_download_url);
                    await native.fs.writePluginFile(id, fileName, content);
                } else if (requiredFiles.includes(fileName)) {
                    // Try to get from repo root for required files
                    const rawUrl = `${GITHUB_RAW_BASE}/${repo}/HEAD/${fileName}`;
                    const response = await fetch(rawUrl);
                    if (response.ok) {
                        const content = await response.text();
                        await native.fs.writePluginFile(id, fileName, content);
                    } else {
                        throw new Error(`Required file ${fileName} not found`);
                    }
                }
            }

            // Record installation
            const installedPlugin: InstalledCommunityPlugin = {
                id,
                name: plugin.name,
                author: plugin.author,
                version: latestVersion,
                repo,
                installedAt: Date.now(),
            };
            this.installedPlugins.set(id, installedPlugin);
            await this.saveInstalledPlugins();

            // Load the plugin into the PluginManager
            await this.loadInstalledPlugin(id);

            this.logger.info(`Successfully installed plugin ${id}`);
            return { success: true, pluginId: id, version: latestVersion };
        } catch (error: any) {
            this.logger.error(`Failed to install plugin ${id}`, error);
            return {
                success: false,
                pluginId: id,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Download an asset from URL
     */
    private async downloadAsset(url: string): Promise<string> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to download: ${response.status}`);
        }
        return response.text();
    }

    /**
     * Uninstall a community plugin
     */
    async uninstallPlugin(pluginId: string): Promise<boolean> {
        try {
            this.logger.info(`Uninstalling plugin ${pluginId}...`);

            // Disable the plugin first if enabled
            const plugin = this.app.pluginManager.getPlugin(pluginId);
            if (plugin?.enabled) {
                await this.app.pluginManager.disablePlugin(pluginId);
            }

            // Remove plugin CSS
            this.removePluginStyles(pluginId);

            // Unregister from plugin manager
            this.app.pluginManager.unregisterPlugin(pluginId);

            // Delete plugin files
            await native.fs.deletePluginDir(pluginId);

            // Remove from installed plugins
            this.installedPlugins.delete(pluginId);
            await this.saveInstalledPlugins();

            this.logger.info(`Successfully uninstalled plugin ${pluginId}`);
            return true;
        } catch (error: any) {
            this.logger.error(`Failed to uninstall plugin ${pluginId}`, error);
            return false;
        }
    }

    /**
     * Check for plugin updates
     */
    async checkForUpdates(): Promise<PluginUpdateInfo[]> {
        const updates: PluginUpdateInfo[] = [];

        for (const [pluginId, installed] of this.installedPlugins) {
            try {
                const listing = this.cache.listings.find((l) => l.id === pluginId);
                if (!listing) continue;

                const plugin = await this.getPluginDetails(listing);
                if (!plugin) continue;

                const hasUpdate = this.compareVersions(installed.version, plugin.latestVersion) < 0;

                updates.push({
                    pluginId,
                    currentVersion: installed.version,
                    latestVersion: plugin.latestVersion,
                    hasUpdate,
                });
            } catch (error: any) {
                this.logger.error(`Failed to check updates for ${pluginId}`, error);
            }
        }

        return updates;
    }

    /**
     * Update a plugin to the latest version
     */
    async updatePlugin(pluginId: string): Promise<PluginInstallResult> {
        const installed = this.installedPlugins.get(pluginId);
        if (!installed) {
            return { success: false, pluginId, error: 'Plugin not installed' };
        }

        // Get plugin details and reinstall
        const listing = this.cache.listings.find((l) => l.id === pluginId);
        if (!listing) {
            return { success: false, pluginId, error: 'Plugin not found in registry' };
        }

        const plugin = await this.getPluginDetails(listing);
        if (!plugin) {
            return { success: false, pluginId, error: 'Failed to get plugin details' };
        }

        // Disable plugin before update
        const pluginInstance = this.app.pluginManager.getPlugin(pluginId);
        const wasEnabled = pluginInstance?.enabled || false;
        if (wasEnabled) {
            await this.app.pluginManager.disablePlugin(pluginId);
        }

        // Reinstall
        const result = await this.installPlugin(plugin);

        // Re-enable if it was enabled
        if (result.success && wasEnabled) {
            await this.app.pluginManager.enablePlugin(pluginId);
        }

        return result;
    }

    /**
     * Load an installed plugin into the PluginManager
     */
    async loadInstalledPlugin(pluginId: string): Promise<boolean> {
        try {
            // Read manifest
            const manifestContent = await native.fs.readPluginFile(pluginId, 'manifest.json');
            const manifest: CommunityPluginManifest = JSON.parse(manifestContent);

            // Read main.js
            const mainJs = await native.fs.readPluginFile(pluginId, 'main.js');

            // Try to read optional styles.css
            let pluginCss: string | null = null;
            try {
                pluginCss = await native.fs.readPluginFile(pluginId, 'styles.css');
            } catch {
                // styles.css is optional
            }

            // Create a loader function that evaluates the plugin code
            const loader = async () => {
                // Inject plugin CSS if present
                if (pluginCss) {
                    this.injectPluginStyles(pluginId, pluginCss);
                }

                // Create a sandboxed module environment
                const exports: any = {};
                const module = { exports };

                // Get the core API exports that will be provided to plugins
                const coreExports = this.getCoreExports();

                // Create the require function for the plugin
                // This provides access to Inkdown core exports
                const require = (id: string) => {
                    // Support multiple module names for flexibility
                    const validModuleNames = [
                        'inkdown-api',
                        '@inkdown/plugin-api',
                        '@inkdown/core',
                        'inkdown',
                    ];

                    if (validModuleNames.includes(id)) {
                        return coreExports;
                    }

                    this.logger.warn(`Plugin ${pluginId} tried to require unknown module: ${id}`);
                    throw new Error(
                        `Cannot require '${id}' - only Inkdown API modules are available`,
                    );
                };

                // Execute the plugin code in a controlled context
                try {
                    // eslint-disable-next-line no-new-func
                    const fn = new Function('module', 'exports', 'require', mainJs);
                    fn(module, exports, require);
                } catch (error: any) {
                    this.logger.error(`Failed to execute plugin ${pluginId}:`, error);
                    throw error;
                }

                // Return the plugin class
                const PluginClass = module.exports.default || module.exports;

                if (!PluginClass) {
                    throw new Error(`Plugin ${pluginId} does not export a default class`);
                }

                return { default: PluginClass };
            };

            // Register with PluginManager
            this.app.pluginManager.registerPlugin({
                manifest,
                isBuiltIn: false,
                loader,
            });

            this.logger.info(`Loaded community plugin: ${manifest.name}`);
            return true;
        } catch (error: any) {
            this.logger.error(`Failed to load plugin ${pluginId}:`, error);
            return false;
        }
    }

    /**
     * Inject plugin CSS styles into the document
     */
    private injectPluginStyles(pluginId: string, css: string): void {
        // Remove existing styles if present
        const existingStyle = document.getElementById(`plugin-styles-${pluginId}`);
        if (existingStyle) {
            existingStyle.remove();
        }

        // Create and inject new style element
        const styleEl = document.createElement('style');
        styleEl.id = `plugin-styles-${pluginId}`;
        styleEl.setAttribute('data-plugin-id', pluginId);
        styleEl.textContent = css;
        document.head.appendChild(styleEl);

        this.logger.debug(`Injected styles for plugin: ${pluginId}`);
    }

    /**
     * Remove plugin CSS styles from the document
     */
    private removePluginStyles(pluginId: string): void {
        const styleEl = document.getElementById(`plugin-styles-${pluginId}`);
        if (styleEl) {
            styleEl.remove();
            this.logger.debug(`Removed styles for plugin: ${pluginId}`);
        }
    }

    /**
     * Load all installed community plugins
     */
    async loadAllInstalledPlugins(): Promise<void> {
        this.logger.info(`Loading ${this.installedPlugins.size} community plugins...`);

        for (const pluginId of this.installedPlugins.keys()) {
            await this.loadInstalledPlugin(pluginId);
        }
    }

    /**
     * Get core exports for plugin require()
     * This provides the API surface available to community plugins
     */
    private getCoreExports(): any {
        // Return the API surface that community plugins can use
        // These are imported at the top of this file
        return {
            // Base classes
            Plugin,
            Component,

            // UI Components
            Modal,
            ConfirmModal,
            Notice,
            Setting,
            PluginSettingTab,
            FuzzySuggestModal,
            PopoverSuggest,
            EditorSuggest,

            // Views
            ItemView,

            // Note: App is passed to plugin constructor, not exported here
        };
    }

    /**
     * Check if cache is valid
     */
    private isCacheValid(): boolean {
        return Date.now() - this.cache.lastFetched < CACHE_TTL && this.cache.listings.length > 0;
    }

    /**
     * Compare semantic versions
     * Returns: -1 if a < b, 0 if a == b, 1 if a > b
     */
    private compareVersions(a: string, b: string): number {
        const partsA = a.split('.').map(Number);
        const partsB = b.split('.').map(Number);

        for (let i = 0; i < 3; i++) {
            const numA = partsA[i] || 0;
            const numB = partsB[i] || 0;
            if (numA < numB) return -1;
            if (numA > numB) return 1;
        }
        return 0;
    }

    /**
     * Get installed plugins
     */
    getInstalledPlugins(): InstalledCommunityPlugin[] {
        return Array.from(this.installedPlugins.values());
    }

    /**
     * Check if a plugin is installed
     */
    isInstalled(pluginId: string): boolean {
        return this.installedPlugins.has(pluginId);
    }

    /**
     * Check if a plugin is installed (alias for UI compatibility)
     */
    isPluginInstalled(pluginId: string): boolean {
        return this.installedPlugins.has(pluginId);
    }

    /**
     * Get installed plugin info
     */
    getInstalledPlugin(pluginId: string): InstalledCommunityPlugin | undefined {
        return this.installedPlugins.get(pluginId);
    }

    /**
     * Get installed version of a plugin
     */
    getInstalledVersion(pluginId: string): string | undefined {
        return this.installedPlugins.get(pluginId)?.version;
    }

    /**
     * Invalidate cache
     */
    invalidateCache(): void {
        this.cache.lastFetched = 0;
        this.cache.plugins = {};
    }

    /**
     * Get plugins directory path
     */
    getPluginsDir(): string {
        return this.pluginsDir;
    }

    /**
     * Get plugin listings (alias for fetchPluginListings for UI compatibility)
     */
    async getPluginListings(forceRefresh = false): Promise<CommunityPluginListing[]> {
        return this.fetchPluginListings(forceRefresh);
    }

    /**
     * Get GitHub repository URL for a plugin
     */
    getRepoUrl(repo: string): string {
        return `https://github.com/${repo}`;
    }
}
