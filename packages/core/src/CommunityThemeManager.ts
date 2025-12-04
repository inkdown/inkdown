import { native } from './native';
import type { App } from './App';
import type {
    CommunityTheme,
    CommunityThemeCache,
    CommunityThemeListing,
    CommunityThemeManifest,
    InstalledCommunityTheme,
    InstalledThemesConfig,
} from './types/community-theme';
import { createLogger } from './utils/logger';

/**
 * GitHub raw content base URL
 */
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';

/**
 * Community themes index URL
 */
const COMMUNITY_THEMES_INDEX =
    'https://raw.githubusercontent.com/inkdown/inkdown-community/main/themes.json';

/**
 * Cache TTL in milliseconds (1 hour)
 */
const CACHE_TTL = 60 * 60 * 1000;

/**
 * CommunityThemeManager - Manages community theme browsing, installation, and removal
 * 
 * This manager handles:
 * - Fetching the community themes index from GitHub
 * - Fetching individual theme manifests and READMEs
 * - Caching theme data to reduce network requests
 * - Installing themes to the local config directory
 * - Removing installed themes
 * - Checking installation status
 */
export class CommunityThemeManager {
    private app: App;
    private logger = createLogger('CommunityThemeManager');
    private cache: CommunityThemeCache | null = null;
    private installedThemes: Map<string, InstalledCommunityTheme> = new Map();
    private fetchingListings = false;
    private fetchingThemes: Set<string> = new Set();

    constructor(app: App) {
        this.app = app;
    }

    /**
     * Initialize the manager - load installed themes config
     */
    async init(): Promise<void> {
        await this.loadInstalledThemes();
        this.logger.info('CommunityThemeManager initialized');
    }

    /**
     * Load installed themes from config
     */
    private async loadInstalledThemes(): Promise<void> {
        try {
            const config = await this.app.configManager.loadConfig<InstalledThemesConfig>(
                'installed-themes'
            );
            if (config?.themes) {
                for (const theme of config.themes) {
                    this.installedThemes.set(theme.id, theme);
                }
            }
        } catch (error) {
            this.logger.debug('No installed themes config found, starting fresh');
        }
    }

    /**
     * Save installed themes to config
     */
    private async saveInstalledThemes(): Promise<void> {
        const config: InstalledThemesConfig = {
            themes: Array.from(this.installedThemes.values()),
        };
        await this.app.configManager.saveConfig('installed-themes', config);
    }

    /**
     * Get the community themes listings
     * Uses cache if available and not expired
     */
    async getThemeListings(forceRefresh = false): Promise<CommunityThemeListing[]> {
        // Check cache first
        if (!forceRefresh && this.cache && Date.now() - this.cache.lastFetched < CACHE_TTL) {
            return this.cache.listings;
        }

        // Prevent concurrent fetches
        if (this.fetchingListings) {
            // Wait for current fetch to complete
            await new Promise((resolve) => setTimeout(resolve, 100));
            return this.cache?.listings ?? [];
        }

        this.fetchingListings = true;

        try {
            this.logger.info('Fetching community themes index...');
            const response = await fetch(COMMUNITY_THEMES_INDEX);
            if (!response.ok) {
                throw new Error(`Failed to fetch themes index: ${response.statusText}`);
            }

            const listings: CommunityThemeListing[] = await response.json();

            // Update cache
            this.cache = {
                lastFetched: Date.now(),
                listings,
                themes: this.cache?.themes ?? {},
            };

            this.logger.info(`Fetched ${listings.length} community themes`);
            return listings;
        } catch (error) {
            this.logger.error('Failed to fetch community themes index', error);
            // Return cached data if available
            return this.cache?.listings ?? [];
        } finally {
            this.fetchingListings = false;
        }
    }

    /**
     * Get full theme details including manifest and README
     * Fetches from GitHub and caches the result
     */
    async getThemeDetails(listing: CommunityThemeListing): Promise<CommunityTheme | null> {
        const themeId = listing.repo;

        // Check cache first
        if (this.cache?.themes[themeId]) {
            const cached = this.cache.themes[themeId];
            // Update installation status
            cached.installed = this.isThemeInstalled(themeId);
            cached.installedVersion = this.getInstalledVersion(themeId);
            return cached;
        }

        // Prevent concurrent fetches for same theme
        if (this.fetchingThemes.has(themeId)) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            return this.cache?.themes[themeId] ?? null;
        }

        this.fetchingThemes.add(themeId);

        try {
            this.logger.info(`Fetching theme details for ${themeId}...`);

            // Fetch manifest (manifest.json)
            const manifestUrl = `${GITHUB_RAW_BASE}/${themeId}/main/manifest.json`;
            const manifestResponse = await fetch(manifestUrl);
            if (!manifestResponse.ok) {
                throw new Error(`Failed to fetch theme manifest: ${manifestResponse.statusText}`);
            }
            const manifest: CommunityThemeManifest = await manifestResponse.json();

            // Fetch README
            const readmeUrl = `${GITHUB_RAW_BASE}/${themeId}/main/README.md`;
            let readme = '';
            try {
                const readmeResponse = await fetch(readmeUrl);
                if (readmeResponse.ok) {
                    readme = await readmeResponse.text();
                }
            } catch {
                this.logger.debug(`No README found for ${themeId}`);
            }

            // Resolve screenshot URL
            const screenshotUrl = `${GITHUB_RAW_BASE}/${themeId}/main/${listing.screenshot}`;

            const theme: CommunityTheme = {
                listing,
                manifest,
                readme,
                screenshotUrl,
                installed: this.isThemeInstalled(themeId),
                installedVersion: this.getInstalledVersion(themeId),
            };

            // Update cache
            if (this.cache) {
                this.cache.themes[themeId] = theme;
            }

            return theme;
        } catch (error) {
            this.logger.error(`Failed to fetch theme details for ${themeId}`, error);
            return null;
        } finally {
            this.fetchingThemes.delete(themeId);
        }
    }

    /**
     * Get screenshot URL for a theme listing
     */
    getScreenshotUrl(listing: CommunityThemeListing): string {
        return `${GITHUB_RAW_BASE}/${listing.repo}/main/${listing.screenshot}`;
    }

    /**
     * Check if a theme is installed
     */
    isThemeInstalled(themeId: string): boolean {
        return this.installedThemes.has(themeId);
    }

    /**
     * Get the installed version of a theme
     */
    getInstalledVersion(themeId: string): string | undefined {
        return this.installedThemes.get(themeId)?.version;
    }

    /**
     * Get all installed community themes
     */
    getInstalledThemes(): InstalledCommunityTheme[] {
        return Array.from(this.installedThemes.values());
    }

    /**
     * Install a community theme
     * Downloads all CSS files and saves to config/themes directory
     */
    async installTheme(theme: CommunityTheme): Promise<void> {
        const themeId = theme.listing.repo;
        this.logger.info(`Installing theme ${themeId}...`);

        try {
            // Create a safe directory name from the repo (e.g., "l-furquim/inkdown-gruvbox" -> "inkdown-gruvbox")
            const themeDirName = themeId.split('/').pop() || themeId.replace('/', '-');

            // Download and save CSS files based on modes (dark.css, light.css)
            const modes = theme.manifest.modes || ['dark'];
            for (const mode of modes) {
                const cssFile = `${mode}.css`;
                const cssUrl = `${GITHUB_RAW_BASE}/${themeId}/main/${cssFile}`;
                const cssResponse = await fetch(cssUrl);
                if (!cssResponse.ok) {
                    throw new Error(`Failed to download CSS for mode ${mode}`);
                }
                const cssContent = await cssResponse.text();

                await native.fs.installCommunityThemeFile(themeDirName, cssFile, cssContent);
            }

            // Save manifest.json
            const manifestJson = JSON.stringify(theme.manifest, null, 2);
            await native.fs.installCommunityThemeFile(themeDirName, 'manifest.json', manifestJson);

            // Save README
            if (theme.readme) {
                await native.fs.installCommunityThemeFile(themeDirName, 'README.md', theme.readme);
            }

            // Update installed themes record
            const installed: InstalledCommunityTheme = {
                id: themeId,
                name: theme.manifest.name,
                author: theme.manifest.author,
                version: theme.manifest.version,
                installedAt: Date.now(),
                modes: theme.manifest.modes || ['dark'],
            };
            this.installedThemes.set(themeId, installed);
            await this.saveInstalledThemes();

            // Update cache
            if (this.cache?.themes[themeId]) {
                this.cache.themes[themeId].installed = true;
                this.cache.themes[themeId].installedVersion = theme.manifest.version;
            }

            // Reload custom themes in ThemeManager
            await this.app.themeManager.reloadCustomThemes();

            this.logger.info(`Theme ${themeId} installed successfully`);
        } catch (error) {
            this.logger.error(`Failed to install theme ${themeId}`, error);
            throw error;
        }
    }

    /**
     * Uninstall a community theme
     * Removes theme files from config/themes directory
     */
    async uninstallTheme(themeId: string): Promise<void> {
        this.logger.info(`Uninstalling theme ${themeId}...`);

        try {
            // Get directory name
            const themeDirName = themeId.split('/').pop() || themeId.replace('/', '-');

            // Remove theme directory via Tauri command
            await native.fs.uninstallCommunityTheme(themeDirName);

            // Remove from installed themes
            this.installedThemes.delete(themeId);
            await this.saveInstalledThemes();

            // Update cache
            if (this.cache?.themes[themeId]) {
                this.cache.themes[themeId].installed = false;
                this.cache.themes[themeId].installedVersion = undefined;
            }

            // Reload custom themes in ThemeManager
            await this.app.themeManager.reloadCustomThemes();

            this.logger.info(`Theme ${themeId} uninstalled successfully`);
        } catch (error) {
            this.logger.error(`Failed to uninstall theme ${themeId}`, error);
            throw error;
        }
    }

    /**
     * Check if a theme has an update available
     */
    hasUpdate(theme: CommunityTheme): boolean {
        const installedVersion = this.getInstalledVersion(theme.listing.repo);
        if (!installedVersion) return false;
        return installedVersion !== theme.manifest.version;
    }

    /**
     * Clear the cache to force refresh
     */
    clearCache(): void {
        this.cache = null;
        this.logger.debug('Cache cleared');
    }

    /**
     * Get GitHub repository URL for a theme
     */
    getRepoUrl(themeId: string): string {
        return `https://github.com/${themeId}`;
    }
}
