import type { App } from '../App';
import { minimatch } from 'minimatch';

export interface SyncIgnoreConfig {
    ignorePatterns: string[];
    ignoredPaths: Record<string, boolean>;
}

export class SelectiveSyncManager {
    private app: App;
    private config: SyncIgnoreConfig = {
        ignorePatterns: [
            '*.tmp',
            '.trash/**',
            'node_modules/**',
        ],
        ignoredPaths: {},
    };

    constructor(app: App) {
        this.app = app;
    }

    async init(): Promise<void> {
        const syncConfig = await this.app.configManager.loadConfig<any>('sync');
        if (syncConfig) {
            this.config = {
                ignorePatterns: syncConfig.ignorePatterns || this.config.ignorePatterns,
                ignoredPaths: syncConfig.ignoredPaths || {},
            };
        }
    }

    shouldIgnore(path: string): boolean {
        // Normalize path (remove leading slash)
        const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

        // Check exact path match
        if (this.config.ignoredPaths[normalizedPath]) {
            return true;
        }

        // Check glob patterns
        for (const pattern of this.config.ignorePatterns) {
            if (minimatch(normalizedPath, pattern)) {
                return true;
            }
        }

        return false;
    }

    async addIgnorePath(path: string): Promise<void> {
        const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
        this.config.ignoredPaths[normalizedPath] = true;
        await this.saveConfig();
    }

    async removeIgnorePath(path: string): Promise<void> {
        const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
        delete this.config.ignoredPaths[normalizedPath];
        await this.saveConfig();
    }

    async addIgnorePattern(pattern: string): Promise<void> {
        if (!this.config.ignorePatterns.includes(pattern)) {
            this.config.ignorePatterns.push(pattern);
            await this.saveConfig();
        }
    }

    async removeIgnorePattern(pattern: string): Promise<void> {
        this.config.ignorePatterns = this.config.ignorePatterns.filter(p => p !== pattern);
        await this.saveConfig();
    }

    getIgnoredPaths(): string[] {
        return Object.keys(this.config.ignoredPaths);
    }

    getIgnorePatterns(): string[] {
        return [...this.config.ignorePatterns];
    }

    isIgnored(path: string): boolean {
        return this.shouldIgnore(path);
    }

    private async saveConfig(): Promise<void> {
        const existingConfig = await this.app.configManager.loadConfig<any>('sync') || {};
        await this.app.configManager.saveConfig('sync', {
            ...existingConfig,
            ignorePatterns: this.config.ignorePatterns,
            ignoredPaths: this.config.ignoredPaths,
        });
    }
}
