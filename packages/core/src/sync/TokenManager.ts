import { Events } from '../Events';

/**
 * Token lifecycle events
 */
export type TokenEvent =
    | 'token-saved' // New access token saved
    | 'token-refreshed' // Token was refreshed
    | 'token-expired' // Token has expired
    | 'token-cleared' // Tokens were cleared (logout)
    | 'auth-required'; // Authentication is required

/**
 * TokenManager - Manages JWT tokens with event-driven lifecycle
 *
 * Features:
 * - Proactive expiration checks with configurable buffer
 * - Event emission for token lifecycle changes
 * - Safe storage abstraction (localStorage for now, can be extended)
 */
export class TokenManager extends Events {
    private readonly ACCESS_TOKEN_KEY = 'inkdown-access-token';
    private readonly REFRESH_TOKEN_KEY = 'inkdown-refresh-token';
    private readonly USER_EMAIL_KEY = 'inkdown-user-email';

    // Default buffer for proactive refresh (1 minute before expiry)
    private readonly DEFAULT_EXPIRY_BUFFER_MS = 60 * 1000;

    /**
     * Save access token and emit event
     */
    saveToken(token: string): void {
        if (!token) {
            console.error('[TokenManager] ERROR: Attempted to save undefined token!');
            return;
        }
        const isRefresh = this.hasToken();
        localStorage.setItem(this.ACCESS_TOKEN_KEY, token);

        if (isRefresh) {
            this.trigger('token-refreshed', { token });
        } else {
            this.trigger('token-saved', { token });
        }
    }

    /**
     * Save refresh token
     */
    saveRefreshToken(token: string): void {
        if (!token) {
            console.error('[TokenManager] ERROR: Attempted to save undefined refresh token!');
            return;
        }
        localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    }

    /**
     * Get access token
     */
    getToken(): string | null {
        return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }

    /**
     * Get refresh token
     */
    getRefreshToken(): string | null {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    /**
     * Check if user has a token (may be expired)
     */
    hasToken(): boolean {
        return !!this.getToken();
    }

    /**
     * Check if user has a valid (non-expired) token
     */
    hasValidToken(): boolean {
        return this.hasToken() && !this.isTokenExpired();
    }

    /**
     * Save user email (from login response)
     */
    saveUserEmail(email: string): void {
        localStorage.setItem(this.USER_EMAIL_KEY, email);
    }

    /**
     * Get user email from storage
     */
    getUserEmail(): string | null {
        return localStorage.getItem(this.USER_EMAIL_KEY);
    }

    /**
     * Get user ID from JWT token payload
     */
    getUserId(): string | null {
        const token = this.getToken();
        if (!token) return null;

        try {
            const payload = this.decodeTokenPayload(token);
            return payload?.user_id || null;
        } catch {
            return null;
        }
    }

    /**
     * Get token expiration timestamp in milliseconds
     */
    getExpiration(): number | null {
        const token = this.getToken();
        if (!token) return null;

        try {
            const payload = this.decodeTokenPayload(token);
            return payload?.exp ? payload.exp * 1000 : null;
        } catch {
            return null;
        }
    }

    /**
     * Clear all tokens and emit event (logout)
     */
    clearTokens(): void {
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.USER_EMAIL_KEY);
        console.log('[TokenManager] All tokens and user data cleared');
        this.trigger('token-cleared');
    }

    /**
     * Check if token is expired
     */
    isTokenExpired(): boolean {
        const expiration = this.getExpiration();
        if (!expiration) return true;
        return Date.now() >= expiration;
    }

    /**
     * Check if token is expiring soon (proactive refresh check)
     * @param bufferMs - Time buffer in milliseconds before actual expiry (default: 1 minute)
     */
    isExpiringSoon(bufferMs: number = this.DEFAULT_EXPIRY_BUFFER_MS): boolean {
        const expiration = this.getExpiration();
        if (!expiration) return true;

        // Token is "expiring soon" if current time + buffer >= expiration
        return Date.now() + bufferMs >= expiration;
    }

    /**
     * Get time until token expires (in milliseconds)
     * Returns 0 if token is already expired, null if no token
     */
    getTimeUntilExpiry(): number | null {
        const expiration = this.getExpiration();
        if (!expiration) return null;
        return Math.max(0, expiration - Date.now());
    }

    /**
     * Notify that authentication is required (for UI to prompt login)
     */
    notifyAuthRequired(): void {
        this.trigger('auth-required');
    }

    /**
     * Safely decode JWT payload
     */
    private decodeTokenPayload(token: string): Record<string, any> | null {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            return JSON.parse(atob(parts[1]));
        } catch {
            return null;
        }
    }
}
