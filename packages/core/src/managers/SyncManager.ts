import type { App } from '../App';
import { TokenManager } from '../sync/TokenManager';
import { AuthService } from '../sync/AuthService';
import { DeviceManager } from '../sync/DeviceManager';
import { LocalDatabase } from '../sync/LocalDatabase';
import { EncryptionManager } from '../sync/EncryptionManager';
import { SyncEngine } from '../sync/SyncEngine';
import { SelectiveSyncManager } from '../sync/SelectiveSyncManager';
import { TokenRefreshService } from '../sync/TokenRefreshService';
import type { SyncConfig } from '../sync/types';
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

    private baseURL: string = 'http://localhost:8080/api/v1';
    private wsURL: string = 'ws://localhost:8080/ws';
    private enabled: boolean = false;

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
        this.wsURL = this.baseURL.replace(/\/api\/v1$/, '').replace(/^http/, 'ws') + '/ws';

        // Update service URLs
        this.authService.setBaseURL(this.baseURL);
        this.deviceManager.setBaseURL(this.baseURL);
        this.encryptionManager.setBaseURL(this.baseURL);

        // Initialize selective sync
        await this.selectiveSync.init();

        // Initialize local database if enabled
        if (this.enabled) {
            try {
                await this.localDatabase.init(config?.localDbName);
                this.logger.debug('Local database initialized');
            } catch (error) {
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
                    await this.startSync();
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
    }

    /**
     * Disable sync functionality
     */
    async disable(): Promise<void> {
        this.logger.info('Disabling sync...');

        // Stop sync FIRST before changing flag
        this.stopSync();

        this.enabled = false;
        await this.saveConfig({ enabled: false });
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

        try {
            this.logger.info('Creating SyncEngine...');

            // Create and configure sync engine
            this.syncEngine = new SyncEngine(
                this.app,
                this.baseURL,
                this.wsURL,
                this.encryptionManager,
                this.localDatabase
            );

            // Inject TokenRefreshService into WebSocketService
            this.syncEngine.getWebSocketService().setTokenRefreshService(this.tokenRefresh);

            this.logger.info('Starting SyncEngine...');
            await this.syncEngine.start();
            this.logger.info('Sync started successfully');
        } catch (error) {
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
            } catch (error) {
                this.logger.error('Failed to register device', error);
                // We continue, but sync might fail later if device not registered
            }

            this.logger.info('Login successful');
        } catch (error) {
            this.logger.error('Login failed', error);
            throw error;
        }
    }

    /**
     * Setup encryption with a dedicated password (new user/first device)
     */
    async setupEncryption(password: string): Promise<void> {
        await this.encryptionManager.setupEncryption(password);

        // Save to storage for auto-restore
        const token = this.tokenManager.getToken();
        if (token) {
            await this.encryptionManager.saveToStorage(token);
        }

        await this.enable();
    }

    /**
     * Unlock encryption with existing password (subsequent devices)
     */
    async unlockEncryption(password: string): Promise<void> {
        await this.encryptionManager.syncKeys(password);

        // Save to storage for auto-restore
        const token = this.tokenManager.getToken();
        if (token) {
            await this.encryptionManager.saveToStorage(token);
        }

        await this.enable();
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
    async logout(disableSync: boolean = false): Promise<void> {
        this.logger.info('Logging out...');

        await this.authService.logout();
        this.tokenManager.clearTokens();
        this.encryptionManager.clearKeys(); // Clear keys from memory
        this.encryptionManager.clearStorage(); // Clear keys from storage
        this.stopSync();

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
        } catch (error) {
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
}
