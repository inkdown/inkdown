import type {
    Workspace,
    CreateWorkspaceRequest,
    UpdateWorkspaceRequest,
} from './types';

import { loggers } from '../utils/logger';

/**
 * WorkspaceSyncService - Handles API calls for workspace management
 */
export class WorkspaceSyncService {
    private serverUrl: string;
    private getAccessToken: () => Promise<string | null>;
    private logger = loggers.sync || loggers.app;

    constructor(
        serverUrl: string,
        getAccessToken: () => Promise<string | null>
    ) {
        this.serverUrl = serverUrl;
        this.getAccessToken = getAccessToken;
    }

    private async getHeaders(): Promise<Headers> {
        const token = await this.getAccessToken();
        const headers = new Headers({
            'Content-Type': 'application/json',
        });
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    }

    /**
     * List all workspaces for the authenticated user
     */
    async listWorkspaces(): Promise<Workspace[]> {
        try {
            const response = await fetch(`${this.serverUrl}/workspaces`, {
                method: 'GET',
                headers: await this.getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`Failed to list workspaces: ${response.statusText}`);
            }

            const data = await response.json();

            console.debug(`Workspaces do usuario encontrados: ${data}`)

            // Handle different response formats
            if (Array.isArray(data)) {
                return data as Workspace[];
            }

            // Check for common wrapper properties
            if (data && typeof data === 'object') {
                if (Array.isArray((data as any).workspaces)) {
                    return (data as any).workspaces as Workspace[];
                }
                if (Array.isArray((data as any).data)) {
                    return (data as any).data as Workspace[];
                }
            }

            this.logger.warn('Unexpected response format for listWorkspaces:', data);
            return [];
        } catch (error) {
            this.logger.error('Failed to list workspaces:', error);
            throw error;
        }
    }

    /**
     * Create a new workspace
     */
    async createWorkspace(request: CreateWorkspaceRequest): Promise<Workspace> {
        try {
            const response = await fetch(`${this.serverUrl}/workspaces`, {
                method: 'POST',
                headers: await this.getHeaders(),
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                throw new Error(`Failed to create workspace: ${response.statusText}`);
            }

            const data = await response.json();

            // Handle wrapped responses
            if (data && (data as any).workspace) {
                return (data as any).workspace as Workspace;
            }
            if (data && (data as any).data) {
                return (data as any).data as Workspace;
            }

            return data as Workspace;
        } catch (error) {
            this.logger.error('Failed to create workspace:', error);
            throw error;
        }
    }

    /**
     * Get a specific workspace by ID
     */
    async getWorkspace(workspaceId: string): Promise<Workspace> {
        try {
            const response = await fetch(`${this.serverUrl}/workspaces/${workspaceId}`, {
                method: 'GET',
                headers: await this.getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`Failed to get workspace: ${response.statusText}`);
            }

            const data = await response.json();

            // Handle wrapped responses
            if (data && (data as any).workspace) {
                return (data as any).workspace as Workspace;
            }
            if (data && (data as any).data) {
                return (data as any).data as Workspace;
            }

            return data as Workspace;
        } catch (error) {
            this.logger.error('Failed to get workspace:', error);
            throw error;
        }
    }

    /**
     * Update a workspace
     */
    async updateWorkspace(workspaceId: string, request: UpdateWorkspaceRequest): Promise<Workspace> {
        try {
            const response = await fetch(`${this.serverUrl}/workspaces/${workspaceId}`, {
                method: 'PUT',
                headers: await this.getHeaders(),
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                throw new Error(`Failed to update workspace: ${response.statusText}`);
            }

            const data = await response.json();

            // Handle wrapped responses
            if (data && (data as any).workspace) {
                return (data as any).workspace as Workspace;
            }
            if (data && (data as any).data) {
                return (data as any).data as Workspace;
            }

            return data as Workspace;
        } catch (error) {
            this.logger.error('Failed to update workspace:', error);
            throw error;
        }
    }

    /**
     * Delete a workspace
     */
    async deleteWorkspace(workspaceId: string): Promise<void> {
        try {
            const response = await fetch(`${this.serverUrl}/workspaces/${workspaceId}`, {
                method: 'DELETE',
                headers: await this.getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`Failed to delete workspace: ${response.statusText}`);
            }
        } catch (error) {
            this.logger.error('Failed to delete workspace:', error);
            throw error;
        }
    }
}
