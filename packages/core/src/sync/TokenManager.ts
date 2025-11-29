/**
 * TokenManager - Manages JWT tokens in localStorage
 */
export class TokenManager {
    private readonly ACCESS_TOKEN_KEY = 'inkdown-access-token';
    private readonly REFRESH_TOKEN_KEY = 'inkdown-refresh-token';

    /**
     * Save access token
     */
    saveToken(token: string): void {
        if (!token) {
            console.error('[TokenManager] ERROR: Attempted to save undefined token!');
            return;
        }
        localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
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
     * Check if user has a token
     */
    hasToken(): boolean {
        return !!this.getToken();
    }

    /**
     * Save user email (from login response)
     */
    saveUserEmail(email: string): void {
        localStorage.setItem('inkdown-user-email', email);
    }

    /**
     * Get user email from storage
     */
    getUserEmail(): string | null {
        return localStorage.getItem('inkdown-user-email');
    }

    /**
     * Get user ID from JWT token
     */
    getUserId(): string | null {
        const token = this.getToken();
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.user_id || null;
        } catch {
            return null;
        }
    }

    /**
     * Clear all tokens (logout)
     */
    clearTokens(): void {
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem('inkdown-user-email');
        console.log('[TokenManager] All tokens and user data cleared');
    }

    /**
     * Check if token is expired
     */
    isTokenExpired(): boolean {
        const token = this.getToken();
        if (!token) return true;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return Date.now() >= payload.exp * 1000;
        } catch {
            return true;
        }
    }

    /**
     * Get time until token expires (in milliseconds)
     */
    getTimeUntilExpiry(): number | null {
        const token = this.getToken();
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiryTime = payload.exp * 1000;
            return Math.max(0, expiryTime - Date.now());
        } catch {
            return null;
        }
    }
}
