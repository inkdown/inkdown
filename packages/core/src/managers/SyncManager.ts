import type { App } from '../App';
import { AuthService } from '../sync/AuthService';
import { DeviceManager } from '../sync/DeviceManager';
import { EncryptionManager } from '../sync/EncryptionManager';
import { LocalDatabase } from '../sync/LocalDatabase';
import { SelectiveSyncManager } from '../sync/SelectiveSyncManager';
import { SyncEngine } from '../sync/SyncEngine';
import { TokenManager } from '../sync/TokenManager';
import { TokenRefreshService } from '../sync/TokenRefreshService';
import type { SyncConfig, Workspace, WorkspaceLink } from '../sync/types';
import { WorkspaceSyncService } from '../sync/WorkspaceSyncService';
import { loggers } from '../utils/logger';

/**
 * SyncManager - Manages synchronization functionality
 * Can be enabled/disabled by user, handles authentication and local caching
 */
export class SyncManager {
    private app: App;
    private logger = loggers.sync || loggers.app;

    public authService: AuthService;
    public tokenManager: TokenManager;
    public deviceManager: DeviceManager;
    public localDatabase: LocalDatabase;
    public encryptionManager: EncryptionManager;
    public selectiveSync: SelectiveSyncManager;
    public tokenRefresh: TokenRefreshService;
    public syncEngine: SyncEngine | null = null;

    private baseURL = 'http://localhost:8080/api/v1';
    private wsURL = 'ws://localhost:8080/ws';
    private enabled = false;
    private workspaceSyncService: WorkspaceSyncService | null = null;
    private currentWorkspaceId: string | undefined;
    private workspaceLinks: WorkspaceLink[] = [];
    
    // Password caching for auto-restore (in memory only, not persisted)
    private lastPassword: string | null = null;

    constructor(app: App) {
        this.app = app;
        this.authService = new AuthService();
        this.tokenManager = new TokenManager();
        this.deviceManager = new DeviceManager();
        this.localDatabase = new LocalDatabase();
        this.encryptionManager = new EncryptionManager();
        this.selectiveSync = new SelectiveSyncManager(app);
        this.tokenRefresh = new TokenRefreshService(app, this.tokenManager, this.authService);

        // Inject token refresh service into encryption manager
        this.encryptionManager.setTokenRefreshService(this.tokenRefresh);
    }

    /**
     * Initialize sync manager
     */
    async init(): Promise<void> {
        this.logger.info('Initializing SyncManager...');

        // Load sync config
        const config = await this.app.configManager.loadConfig<SyncConfig>('sync');
        this.enabled = config?.enabled || false;

        this.baseURL = config?.serverUrl || 'http://localhost:8080/api/v1';
        this.wsURL = `${this.baseURL.replace(/\/api\/v1$/, '').replace(/^http/, 'ws')}/ws`;

        // Update service URLs
        this.authService.setBaseURL(this.baseURL);
        this.deviceManager.setBaseURL(this.baseURL);
        this.encryptionManager.setBaseURL(this.baseURL);

        // Load workspace links from config
        this.workspaceLinks = config?.workspaceLinks || [];
        this.currentWorkspaceId = config?.currentWorkspaceId;

        // Log loaded config for debugging
        this.logger.info('SyncManager config loaded:', {
            enabled: this.enabled,
            currentWorkspaceId: this.currentWorkspaceId,
            workspaceLinksCount: this.workspaceLinks.length,
        });

        // Initialize selective sync
        await this.selectiveSync.init();

        // Initialize local database if enabled
        if (this.enabled) {
            try {
                await this.localDatabase.init(config?.localDbName);
                this.logger.debug('Local database initialized');
            } catch (error: any) {
                this.logger.error('Failed to initialize local database', error);
            }
        }

        // If enabled and has token, try to restore encryption session
        if (this.enabled && this.tokenManager.hasToken()) {
            if (this.tokenManager.isTokenExpired()) {
                await this.tryRefreshToken();
            }

            if (this.tokenManager.hasToken()) {
                const token = this.tokenManager.getToken()!;

                // Try to restore from storage first
                const restored = await this.encryptionManager.restoreFromStorage(token);

                if (restored) {
                    this.logger.info('Encryption session restored, starting sync');
                    // Do not await startSync here, as it waits for workspace to be ready
                    // and workspace readiness depends on App.init completing and UI mounting
                    this.startSync().catch((err) => {
                        this.logger.error('Failed to start sync in background:', err);
                    });
                } else {
                    this.logger.warn('Encryption session not found - user needs to unlock');
                    // Emit event for UI to show unlock prompt
                    this.app.workspace.triggerSyncUnlockRequired();
                }
            }
        }

        this.logger.info(`SyncManager initialized (enabled: ${this.enabled})`);
    }

    /**
     * Enable sync functionality
     */
    async enable(): Promise<void> {
        if (!this.encryptionManager.isInitialized()) {
            throw new Error('Encryption not initialized. Please provide encryption password.');
        }

        this.logger.info('Enabling sync...');
        this.enabled = true;

        await this.saveConfig({ enabled: true });

        // Initialize local database
        const config = await this.app.configManager.loadConfig<SyncConfig>('sync');
        await this.localDatabase.init(config?.localDbName);

        // Start sync if logged in
        if (this.tokenManager.hasToken()) {
            await this.startSync();
        }
        
        // Notify UI components that sync state changed
        this.app.workspace.triggerSyncStateChanged(true);
    }

    /**
     * Disable sync functionality
     */
    async disable(): Promise<void> {
        this.logger.info('Disabling sync...');

        // Stop sync FIRST before changing flag
        this.stopSync();

        this.enabled = false;
        
        // Clear cached password
        this.lastPassword = null;
        
        await this.saveConfig({ enabled: false });
        
        // Notify UI components that sync state changed
        this.app.workspace.triggerSyncStateChanged(false);
    }

    /**
     * Start WebSocket connection and periodic sync
     */
    async startSync(): Promise<void> {
        this.logger.info('startSync() called');
        this.logger.info(`  - enabled: ${this.enabled}`);
        this.logger.info(`  - syncEngine active: ${this.syncEngine?.isActive()}`);
        this.logger.info(`  - isLoggedIn: ${this.isLoggedIn()}`);
        this.logger.info(`  - encryption initialized: ${this.encryptionManager.isInitialized()}`);
        this.logger.info(`  - baseURL: ${this.baseURL}`);
        this.logger.info(`  - wsURL: ${this.wsURL}`);

        if (!this.enabled) {
            this.logger.info('Sync not enabled, skipping start');
            return;
        }

        if (this.syncEngine?.isActive()) {
            this.logger.info('Sync already running');
            return;
        }

        if (!this.isLoggedIn()) {
            this.logger.info('Not logged in, cannot start sync');
            return;
        }

        if (!this.encryptionManager.isInitialized()) {
            this.logger.info('Encryption not initialized, cannot start sync');
            return;
        }

        // Wait for workspace to be ready (files loaded)
        if (!this.app.workspace.getRoot()) {
            this.logger.info('Waiting for workspace to be ready...');
            await new Promise<void>((resolve) => {
                const ref = this.app.workspace.on('workspace:ready', () => {
                    ref.unload();
                    resolve();
                });
            });
            this.logger.info('Workspace ready, proceeding with sync start');
        }

        try {
            this.logger.info('Creating SyncEngine...');

            this.syncEngine = new SyncEngine(
                this.app,
                this.baseURL,
                this.wsURL,
                this.encryptionManager,
                this.localDatabase,
            );

            // Set workspace ID if available
            if (this.currentWorkspaceId) {
                this.syncEngine.setWorkspaceId(this.currentWorkspaceId);
            }

            // Inject TokenRefreshService into WebSocketService
            this.syncEngine.getWebSocketService().setTokenRefreshService(this.tokenRefresh);

            this.logger.info('Starting SyncEngine...');
            await this.syncEngine.start();
            this.logger.info('Sync started successfully');
        } catch (error: any) {
            this.logger.error('Failed to start sync:', error);
            throw error;
        }
    }

    /**
     * Stop sync (disconnect WebSocket, clear interval)
     */
    stopSync(): void {
        if (this.syncEngine) {
            this.syncEngine.stop();
            this.logger.info('Sync stopped');
        }
    }

    /**
     * Manually trigger sync now
     */
    async syncNow(): Promise<void> {
        // GUARD: Don't sync if disabled
        if (!this.enabled) {
            this.logger.debug('syncNow() called but sync is disabled - skipping');
            return;
        }

        if (!this.tokenManager.hasToken()) {
            this.logger.warn('Cannot sync: not logged in');
            return;
        }

        this.logger.info('Syncing now...');

        if (this.syncEngine) {
            await this.syncEngine.sync();
        } else {
            // If engine not running but enabled, try to start it
            await this.startSync();
        }
    }

    /**
     * Login to sync service
     * Note: This does NOT enable sync or setup encryption automatically anymore.
     * User must explicitly enable sync and provide encryption password.
     */
    async login(email: string, password: string): Promise<void> {
        this.logger.info(`Logging in as ${email}...`);

        try {
            const { data } = await this.authService.login({ email, password });
            console.log('[SyncManager] Login API response:', data);

            this.tokenManager.saveToken(data.access_token);
            this.tokenManager.saveRefreshToken(data.refresh_token);
            this.tokenManager.saveUserEmail(data.user.email);

            // Register Device immediately after login
            try {
                await this.deviceManager.registerDevice(data.access_token);
            } catch (error: any) {
                this.logger.error('Failed to register device', error);
                // We continue, but sync might fail later if device not registered
            }

            this.logger.info('Login successful');
        } catch (error: any) {
            this.logger.error('Login failed', error);
            throw error;
        }
    }

    /**
     * Get cached password (for auto-restore)
     */
    getLastPassword(): string | null {
        return this.lastPassword;
    }

    /**
     * Set cached password (internal use)
     */
    private setLastPassword(password: string): void {
        this.lastPassword = password;
    }

    /**
     * Setup encryption with a dedicated password (new user/first device)
     * @param password - The encryption password
     * @param autoEnable - Whether to automatically enable sync after setup (default: true for backward compatibility)
     */
    async setupEncryption(password: string, autoEnable = true): Promise<void> {
        await this.encryptionManager.setupEncryption(password);

        // Cache password in memory for auto-restore
        this.setLastPassword(password);

        if (autoEnable) {
            await this.enable();
        }
    }

    /**
     * Unlock encryption with existing password (subsequent devices)
     * @param password - The encryption password
     * @param autoEnable - Whether to automatically enable sync after unlock (default: true for backward compatibility)
     */
    async unlockEncryption(password: string, autoEnable = true): Promise<void> {
        await this.encryptionManager.syncKeys(password);

        // Cache password in memory for auto-restore
        this.setLastPassword(password);

        if (autoEnable) {
            await this.enable();
        }
    }

    /**
     * Check if user has encryption keys on server
     */
    async hasKeysOnServer(): Promise<boolean> {
        if (!this.tokenManager.hasToken()) return false;
        return this.encryptionManager.checkKeysExistence();
    }

    /**
     * Logout and optionally disable sync
     */
    async logout(disableSync = false): Promise<void> {
        this.logger.info('Logging out...');

        await this.authService.logout();
        this.tokenManager.clearTokens();
        this.encryptionManager.clearKeys(); // Clear keys from memory
        this.encryptionManager.clearStorage(); // Clear keys from storage
        this.stopSync();
        
        // Clear cached password
        this.lastPassword = null;

        // Clear local sync data to prevent orphaned mappings on next login
        try {
            await this.localDatabase.clear();
            this.logger.info('Local sync data cleared');
        } catch (error: any) {
            this.logger.warn('Failed to clear local sync data:', error);
        }

        if (disableSync) {
            await this.disable();
        }

        this.logger.info('Logout successful');
    }

    /**
     * Try to refresh access token using refresh token
     */
    private async tryRefreshToken(): Promise<void> {
        const refreshToken = this.tokenManager.getRefreshToken();
        if (!refreshToken) {
            this.logger.warn('No refresh token available');
            this.tokenManager.clearTokens();
            return;
        }

        try {
            this.logger.debug('Refreshing access token...');
            const { data } = await this.authService.refreshToken(refreshToken);
            this.tokenManager.saveToken(data.access_token);
            this.tokenManager.saveRefreshToken(data.refresh_token);
            this.logger.debug('Token refreshed successfully');
        } catch (error: any) {
            this.logger.error('Token refresh failed', error);
            this.tokenManager.clearTokens();
        }
    }

    /**
     * Save sync configuration
     */
    private async saveConfig(updates: Partial<SyncConfig>): Promise<void> {
        const config = await this.app.configManager.loadConfig<SyncConfig>('sync');
        const updated = { ...config, ...updates };
        await this.app.configManager.saveConfig('sync', updated);
    }

    /**
     * Check if user is logged in
     */
    isLoggedIn(): boolean {
        return this.tokenManager.hasToken();
    }

    /**
     * Check if sync is enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    // ============================================
    // Workspace Management
    // ============================================

    /**
     * Get WorkspaceSyncService instance (creates if needed)
     */
    getWorkspaceSyncService(): WorkspaceSyncService {
        if (!this.workspaceSyncService) {
            this.workspaceSyncService = new WorkspaceSyncService(this.baseURL, async () => {
                // Check if token needs refresh before returning
                if (this.tokenManager.isTokenExpired()) {
                    await this.tryRefreshToken();
                }
                return this.tokenManager.getToken();
            });
        }
        return this.workspaceSyncService;
    }

    /**
     * List all workspaces for the user
     */
    async listWorkspaces(): Promise<Workspace[]> {
        return this.getWorkspaceSyncService().listWorkspaces();
    }

    /**
     * Create a new workspace
     */
    async createWorkspace(name: string): Promise<Workspace> {
        return this.getWorkspaceSyncService().createWorkspace({ name });
    }

    /**
     * Link a local directory path to a remote workspace
     */
    async linkWorkspace(localPath: string, workspaceId: string): Promise<void> {
        // Ensure database is initialized before any operations
        if (!this.localDatabase['db']) {
            this.logger.info('Initializing local database before linking...');
            const config = await this.app.configManager.loadConfig<SyncConfig>('sync');
            await this.localDatabase.init(config?.localDbName);
        }

        // Remove any existing link for this path
        this.workspaceLinks = this.workspaceLinks.filter((l) => l.localPath !== localPath);

        // Add new link
        const link: WorkspaceLink = {
            localPath,
            remoteWorkspaceId: workspaceId,
            linkedAt: new Date().toISOString(),
        };
        this.workspaceLinks.push(link);

        // Set as current workspace
        this.currentWorkspaceId = workspaceId;

        // Save to config
        await this.saveConfig({
            workspaceLinks: this.workspaceLinks,
            currentWorkspaceId: workspaceId,
        });

        // Always clear mappings when linking - ensures fresh sync
        // Old mappings may point to wrong paths from previous folder
        this.logger.info('Clearing local database mappings for fresh sync...');
        await this.localDatabase.clearAllMappings();

        // Update sync engine if running and trigger sync to pull notes
        if (this.syncEngine) {
            this.syncEngine.setWorkspaceId(workspaceId);
            
            // Trigger sync to pull notes from the newly linked workspace
            this.logger.info('Triggering sync after workspace link...');
            await this.syncEngine.triggerSync();
        }

        this.logger.info(`Linked workspace ${workspaceId} to ${localPath}`);
    }

    /**
     * Unlink a local directory from its workspace
     */
    async unlinkWorkspace(localPath: string): Promise<void> {
        this.workspaceLinks = this.workspaceLinks.filter((l) => l.localPath !== localPath);

        // If we unlinked the current workspace, clear it
        const link = this.workspaceLinks.find((l) => l.localPath === localPath);
        if (link?.remoteWorkspaceId === this.currentWorkspaceId) {
            this.currentWorkspaceId = undefined;
            if (this.syncEngine) {
                this.syncEngine.setWorkspaceId(undefined);
            }
        }

        await this.saveConfig({
            workspaceLinks: this.workspaceLinks,
            currentWorkspaceId: this.currentWorkspaceId,
        });

        this.logger.info(`Unlinked workspace from ${localPath}`);
    }

    /**
     * Handle local workspace folder change
     * Cleans up all sync state when user switches to a different local folder
     * - Stops sync engine
     * - Clears IndexedDB sync cache
     * - Unlinks remote workspace
     * - Disables sync
     */
    async handleLocalWorkspaceChange(newLocalPath: string): Promise<void> {
        this.logger.info(`Local workspace changed to: ${newLocalPath}`);
        
        // 1. Stop sync engine if running
        this.stopSync();
        
        // 2. Clear all sync data from IndexedDB
        this.logger.info('Clearing sync cache...');
        await this.localDatabase.clear();
        await this.localDatabase.clearAllMappings();
        
        // 3. Clear workspace links and current workspace ID
        this.workspaceLinks = [];
        this.currentWorkspaceId = undefined;
        
        // 4. Disable sync
        this.enabled = false;
        
        // 5. Save config with cleared state
        await this.saveConfig({
            enabled: false,
            workspaceLinks: [],
            currentWorkspaceId: undefined,
        });
        
        this.logger.info('Sync state cleared for workspace change');
    }

    /**
     * Get the workspace link for a local path
     */
    getWorkspaceLink(localPath: string): WorkspaceLink | undefined {
        return this.workspaceLinks.find((l) => l.localPath === localPath);
    }

    /**
     * Get all workspace links
     */
    getWorkspaceLinks(): WorkspaceLink[] {
        return [...this.workspaceLinks];
    }

    /**
     * Get current workspace ID
     */
    getCurrentWorkspaceId(): string | undefined {
        return this.currentWorkspaceId;
    }

    /**
     * Set the current workspace ID
     */
    async setCurrentWorkspaceId(workspaceId: string | undefined): Promise<void> {
        this.currentWorkspaceId = workspaceId;

        await this.saveConfig({ currentWorkspaceId: workspaceId });

        if (this.syncEngine) {
            this.syncEngine.setWorkspaceId(workspaceId);
        }
    }
}
