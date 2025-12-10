import type { AuthResponse, LoginData, RegisterData } from './types';

/**
 * Auth error with additional context
 */
export class AuthError extends Error {
    public readonly status: number;
    public readonly code: string;

    constructor(message: string, status = 0, code = 'AUTH_ERROR') {
        super(message);
        this.name = 'AuthError';
        this.status = status;
        this.code = code;
    }
}

/**
 * AuthService - Handles communication with Inkdown Sync Server
 *
 * Features:
 * - Configurable timeout for requests
 * - Detailed error messages
 * - AbortController support for cancellation
 */
export class AuthService {
    private baseURL: string;
    private readonly DEFAULT_TIMEOUT_MS = 30000; // 30 seconds

    constructor(baseURL = 'http://localhost:8080/api/v1') {
        this.baseURL = baseURL;
    }

    /**
     * Update the base URL for API requests
     */
    setBaseURL(url: string): void {
        this.baseURL = url;
    }

    /**
     * Login with email and password
     */
    async login(data: LoginData, timeoutMs?: number): Promise<AuthResponse> {
        try {
            const response = await this.fetchWithTimeout(
                `${this.baseURL}/auth/login`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                },
                timeoutMs,
            );

            if (!response.ok) {
                const error = await this.parseErrorResponse(response);
                throw new AuthError(
                    (error as any).message || 'Login failed. Please check your credentials.',
                    response.status,
                    error.code || 'LOGIN_FAILED',
                );
            }

            return response.json();
        } catch (error: any) {
            if (error instanceof AuthError) throw error;
            throw this.wrapError(error, 'Login failed');
        }
    }

    /**
     * Register a new account
     */
    async register(data: RegisterData, timeoutMs?: number): Promise<void> {
        try {
            const response = await this.fetchWithTimeout(
                `${this.baseURL}/auth/register`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                },
                timeoutMs,
            );

            if (!response.ok) {
                const error = await this.parseErrorResponse(response);

                // Provide user-friendly error messages
                let message = (error as any).message || 'Registration failed';
                if (response.status === 409) {
                    message = 'An account with this email already exists.';
                } else if (response.status === 400) {
                    message =
                        (error as any).message ||
                        'Invalid registration data. Please check your input.';
                }

                throw new AuthError(message, response.status, error.code || 'REGISTRATION_FAILED');
            }
        } catch (error: any) {
            if (error instanceof AuthError) throw error;
            throw this.wrapError(error, 'Registration failed');
        }
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshToken(refreshToken: string, timeoutMs?: number): Promise<AuthResponse> {
        try {
            const response = await this.fetchWithTimeout(
                `${this.baseURL}/auth/refresh`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshToken }),
                },
                timeoutMs,
            );

            if (!response.ok) {
                const error = await this.parseErrorResponse(response);
                throw new AuthError(
                    (error as any).message || 'Session expired. Please login again.',
                    response.status,
                    'TOKEN_REFRESH_FAILED',
                );
            }

            return response.json();
        } catch (error: any) {
            if (error instanceof AuthError) throw error;
            throw this.wrapError(error, 'Token refresh failed');
        }
    }

    /**
     * Logout (invalidate token on server if supported)
     */
    async logout(accessToken?: string): Promise<void> {
        if (!accessToken) {
            return; // Nothing to do on server
        }

        try {
            // Attempt to invalidate token on server (best effort)
            await this.fetchWithTimeout(
                `${this.baseURL}/auth/logout`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
                5000, // Short timeout for logout
            );
        } catch {
            // Ignore logout errors - client-side cleanup is sufficient
            console.log('[AuthService] Server logout failed - proceeding with client cleanup');
        }
    }

    /**
     * Fetch with timeout support
     */
    private async fetchWithTimeout(
        url: string,
        options: RequestInit,
        timeoutMs: number = this.DEFAULT_TIMEOUT_MS,
    ): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            return response;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw new AuthError(
                    'Request timed out. Please check your connection and try again.',
                    0,
                    'TIMEOUT',
                );
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Parse error response from server
     */
    private async parseErrorResponse(
        response: Response,
    ): Promise<{ message?: string; code?: string }> {
        try {
            const data = await response.json();
            return {
                message: data.message || data.error || data.msg,
                code: data.code || data.error_code,
            };
        } catch {
            return { message: response.statusText };
        }
    }

    /**
     * Wrap generic errors with context
     */
    private wrapError(error: any, context: string): AuthError {
        if (error instanceof TypeError && (error as any).message.includes('fetch')) {
            return new AuthError(
                'Unable to connect to the server. Please check your internet connection.',
                0,
                'NETWORK_ERROR',
            );
        }
        return new AuthError(
            (error as any)?.message || context,
            error?.status || 0,
            'UNKNOWN_ERROR',
        );
    }
}
