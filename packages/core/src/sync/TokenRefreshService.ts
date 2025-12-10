// Note: App type kept for constructor compatibility but not stored
import { Events } from '../Events';
import { loggers } from '../utils/logger';
import type { AuthService } from './AuthService';
import type { TokenManager } from './TokenManager';

/**
 * TokenRefreshService - Manages automatic token refresh with proactive checking
 *
 * Features:
 * - Proactive token refresh before expiry
 * - Automatic retry on 401 errors
 * - Mutex pattern prevents concurrent refreshes
 * - Event emission for auth state changes
 */
export class TokenRefreshService extends Events {
    private tokenManager: TokenManager;
    private authService: AuthService;
    private logger = loggers.sync || loggers.app;

    // Refresh state
    private isRefreshing = false;
    private refreshPromise: Promise<void> | null = null;

    // Callbacks for auth failures (UI can subscribe)
    private onAuthFailedCallback: (() => void) | null = null;

    constructor(_app: unknown, tokenManager: TokenManager, authService: AuthService) {
        super();
        this.tokenManager = tokenManager;
        this.authService = authService;
    }

    /**
     * Set callback for when authentication fails irreversibly
     */
    setOnAuthFailed(callback: () => void): void {
        this.onAuthFailedCallback = callback;
    }

    /**
     * Ensure we have a valid access token, proactively refreshing if needed
     * This should be called before making any authenticated request
     */
    async ensureValidToken(): Promise<string> {
        const token = this.tokenManager.getToken();

        // No token at all - user needs to login
        if (!token) {
            this.logger.warn('[TokenRefreshService] No token available');
            this.tokenManager.notifyAuthRequired();
            throw new Error('Not authenticated');
        }

        // Proactively refresh if token is expiring soon (within 1 minute)
        if (this.tokenManager.isExpiringSoon()) {
            this.logger.debug(
                '[TokenRefreshService] Token expiring soon, refreshing proactively...',
            );
            try {
                await this.refreshToken();
            } catch (_error) {
                // If proactive refresh fails, still return current token
                // The request might succeed if token isn't actually expired yet
                this.logger.warn(
                    '[TokenRefreshService] Proactive refresh failed, using existing token',
                );
            }
        }

        // Return current token (refreshed or original)
        const currentToken = this.tokenManager.getToken();
        if (!currentToken) {
            throw new Error('Not authenticated');
        }
        return currentToken;
    }

    /**
     * Refresh the access token using the refresh token
     * Uses mutex pattern to prevent concurrent refreshes
     */
    async refreshToken(): Promise<void> {
        // If already refreshing, wait for that operation to complete
        if (this.isRefreshing && this.refreshPromise) {
            this.logger.debug(
                '[TokenRefreshService] Token refresh already in progress, waiting...',
            );
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
            this.logger.error('[TokenRefreshService] No refresh token available');
            this.handleAuthFailure();
            throw new Error('No refresh token - please login again');
        }

        try {
            this.logger.debug('[TokenRefreshService] Refreshing token...');
            const { data } = await this.authService.refreshToken(refreshToken);

            // Save new tokens
            this.tokenManager.saveToken(data.access_token);
            this.tokenManager.saveRefreshToken(data.refresh_token);

            this.logger.info('[TokenRefreshService] Token refreshed successfully');
            this.trigger('token-refreshed');
        } catch (error: any) {
            this.logger.error(
                '[TokenRefreshService] Token refresh failed:',
                (error as any)?.message || error,
            );
            this.handleAuthFailure();
            throw new Error('Token refresh failed - please login again');
        }
    }

    /**
     * Handle authentication failure
     */
    private handleAuthFailure(): void {
        // Clear invalid tokens
        this.tokenManager.clearTokens();

        // Notify listeners
        this.trigger('auth-failed');
        this.tokenManager.notifyAuthRequired();

        // Call callback if set
        if (this.onAuthFailedCallback) {
            this.onAuthFailedCallback();
        }
    }

    /**
     * Wrapper for authenticated requests with automatic retry on 401
     *
     * @param fn Function that takes a token and returns a promise
     * @returns The result of the function
     */
    async withAuth<T>(fn: (token: string) => Promise<T>): Promise<T> {
        // First attempt with current token (proactively refreshed if needed)
        try {
            const token = await this.ensureValidToken();
            return await fn(token);
        } catch (error: any) {
            // Check for 401 Unauthorized
            const isUnauthorized = this.isUnauthorizedError(error);

            if (isUnauthorized) {
                this.logger.debug(
                    '[TokenRefreshService] Received 401, attempting token refresh...',
                );

                // Force refresh the token
                try {
                    await this.refreshToken();
                } catch (_refreshError) {
                    // Refresh failed - don't retry, throw original error
                    throw error;
                }

                // Retry the request with new token
                const newToken = await this.ensureValidToken();
                return await fn(newToken);
            }

            // Not a 401 - rethrow original error
            throw error;
        }
    }

    /**
     * Check if an error indicates unauthorized (401)
     */
    private isUnauthorizedError(error: any): boolean {
        if (!error) return false;

        // Check various common ways this might be represented
        if (error.status === 401 || error.statusCode === 401) return true;

        if ((error as any).message) {
            const msg = (error as any).message.toLowerCase();
            return (
                msg.includes('401') ||
                msg.includes('unauthorized') ||
                msg.includes('token expired') ||
                msg.includes('invalid token')
            );
        }

        return false;
    }

    /**
     * Check if user is authenticated (has a valid token)
     */
    isAuthenticated(): boolean {
        return this.tokenManager.hasValidToken();
    }

    /**
     * Check if user has any token (may be expired)
     */
    hasToken(): boolean {
        return this.tokenManager.hasToken();
    }
}
