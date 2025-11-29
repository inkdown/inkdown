import type { App } from '../App';
import { TokenManager } from './TokenManager';
import { AuthService } from './AuthService';
import { loggers } from '../utils/logger';

/**
 * TokenRefreshService - Manages automatic token refresh with mutex pattern
 * 
 * Features:
 * - Automatic token refresh on 401 errors
 * - Mutex pattern prevents concurrent refreshes
 * - Transparent wrapper for authenticated requests
 */
export class TokenRefreshService {
    private app: App;
    private tokenManager: TokenManager;
    private authService: AuthService;
    private logger = loggers.sync || loggers.app;

    // Refresh state
    private isRefreshing = false;
    private refreshPromise: Promise<void> | null = null;

    constructor(app: App, tokenManager: TokenManager, authService: AuthService) {
        this.app = app;
        this.tokenManager = tokenManager;
        this.authService = authService;
    }

    /**
     * Ensure we have a valid access token, refreshing if necessary
     * Multiple concurrent calls will wait for the same refresh
     */
    async ensureValidToken(): Promise<string> {
        const token = this.tokenManager.getToken();

        // No token at all - user needs to login
        if (!token) {
            throw new Error('Not authenticated');
        }

        // We don't check expiration here anymore, we rely on the server returning 401
        // This is more robust as client/server clocks might drift
        return token;
    }

    /**
     * Refresh the access token using the refresh token
     * Uses mutex pattern to prevent concurrent refreshes
     */
    private async refreshToken(): Promise<void> {
        // If already refreshing, wait for that operation to complete
        if (this.isRefreshing && this.refreshPromise) {
            this.logger.debug('Token refresh already in progress, waiting...');
            await this.refreshPromise;
            return;
        }

        // Start new refresh
        this.isRefreshing = true;
        this.refreshPromise = this.performTokenRefresh();

        try {
            await this.refreshPromise;
        } finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
        }
    }

    /**
     * Actually perform the token refresh
     */
    private async performTokenRefresh(): Promise<void> {
        const refreshToken = this.tokenManager.getRefreshToken();

        if (!refreshToken) {
            this.logger.error('No refresh token available');
            this.tokenManager.clearTokens();
            throw new Error('No refresh token - please login again');
        }

        try {
            const { data } = await this.authService.refreshToken(refreshToken);

            // Save new tokens
            this.tokenManager.saveToken(data.access_token);
            this.tokenManager.saveRefreshToken(data.refresh_token);

            this.logger.info('Token refreshed successfully');
        } catch (error) {
            this.logger.error('Token refresh failed:', error);

            // Refresh token is invalid - clear everything
            this.tokenManager.clearTokens();
            throw new Error('Token refresh failed - please login again');
        }
    }

    /**
     * Wrapper for authenticated requests with automatic retry on 401
     * 
     * @param fn Function that takes a token and returns a promise
     * @returns The result of the function
     */
    async withAuth<T>(fn: (token: string) => Promise<T>): Promise<T> {
        // First attempt with current token
        try {
            const token = await this.ensureValidToken();
            return await fn(token);
        } catch (error: any) {
            // Check for 401 Unauthorized
            // We check various common ways this might be represented
            const isUnauthorized =
                error.status === 401 ||
                error.statusCode === 401 ||
                (error.message && (
                    error.message.includes('401') ||
                    error.message.toLowerCase().includes('unauthorized') ||
                    error.message.toLowerCase().includes('token expired')
                ));

            if (isUnauthorized) {
                this.logger.debug('Received 401, attempting token refresh...');

                // Force refresh the token
                await this.refreshToken();

                // Retry the request with new token
                const newToken = await this.ensureValidToken();
                return await fn(newToken);
            }

            // Not a 401 or already tried refresh - rethrow
            throw error;
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return this.tokenManager.hasToken();
    }
}
