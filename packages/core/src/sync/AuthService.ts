import type { AuthResponse, LoginData, RegisterData } from './types';

/**
 * AuthService - Handles communication with Inkdown Sync Server
 */
export class AuthService {
    private baseURL: string;

    constructor(baseURL: string = 'http://localhost:8080/api/v1') {
        this.baseURL = baseURL;
    }

    /**
     * Login with email and password
     */
    async login(data: LoginData): Promise<AuthResponse> {
        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Login failed' }));
            throw new Error(error.message || 'Login failed');
        }

        return response.json();
    }

    /**
     * Register a new account
     */
    async register(data: RegisterData): Promise<void> {
        const response = await fetch(`${this.baseURL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Registration failed' }));
            throw new Error(error.message || 'Registration failed');
        }
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshToken(refreshToken: string): Promise<AuthResponse> {
        const response = await fetch(`${this.baseURL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) {
            throw new Error('Token refresh failed');
        }

        return response.json();
    }

    /**
     * Logout (client-side only for now)
     */
    async logout(): Promise<void> {
        // For now, just a placeholder
        // In the future, could call server to invalidate token
        return Promise.resolve();
    }
}
