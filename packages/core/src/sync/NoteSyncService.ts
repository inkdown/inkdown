import type { EncryptionManager } from './EncryptionManager';
import type { TokenManager } from './TokenManager';
import type { DeviceManager } from './DeviceManager';
import type {
    NoteResponse,
    CreateNoteRequest,
    UpdateNoteRequest,
    SyncResponse,
    NoteChange,
    ManifestResponse,
    LocalNoteInfo,
    BatchDiffResponse,
} from './types';

export class NoteSyncService {
    private baseURL: string;
    private encryptionManager: EncryptionManager;
    private tokenManager: TokenManager;
    private deviceManager: DeviceManager;

    constructor(
        baseURL: string,
        encryptionManager: EncryptionManager,
        tokenManager: TokenManager,
        deviceManager: DeviceManager
    ) {
        this.baseURL = baseURL;
        this.encryptionManager = encryptionManager;
        this.tokenManager = tokenManager;
        this.deviceManager = deviceManager;
    }

    async createNote(request: Omit<CreateNoteRequest, 'device_id'>): Promise<NoteResponse> {
        const token = this.tokenManager.getToken();
        if (!token) throw new Error('Not authenticated');

        const deviceId = this.deviceManager.getDeviceId();
        if (!deviceId) throw new Error('Device not registered');

        const response = await fetch(`${this.baseURL}/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                ...request,
                device_id: deviceId,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to create note: ${error}`);
        }

        const result = await response.json();
        return result.data;
    }

    async updateNote(
        noteId: string,
        request: Omit<UpdateNoteRequest, 'device_id'>
    ): Promise<NoteResponse> {
        const token = this.tokenManager.getToken();
        if (!token) throw new Error('Not authenticated');

        const deviceId = this.deviceManager.getDeviceId();
        if (!deviceId) throw new Error('Device not registered');

        const response = await fetch(`${this.baseURL}/notes/${noteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                ...request,
                device_id: deviceId,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to update note: ${error}`);
        }

        const result = await response.json();
        return result.data;
    }

    async getNote(noteId: string): Promise<NoteResponse> {
        const token = this.tokenManager.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${this.baseURL}/notes/${noteId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to get note: ${error}`);
        }

        const result = await response.json();
        return result.data;
    }

    async listNotes(): Promise<NoteResponse[]> {
        const token = this.tokenManager.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${this.baseURL}/notes`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to list notes: ${error}`);
        }

        const result = await response.json();
        return result.data;
    }

    async deleteNote(noteId: string): Promise<void> {
        const token = this.tokenManager.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${this.baseURL}/notes/${noteId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to delete note: ${error}`);
        }
    }

    async getChangesSince(since: Date): Promise<NoteChange[]> {
        const token = this.tokenManager.getToken();
        if (!token) throw new Error('Not authenticated');

        const sinceParam = since.toISOString();
        const response = await fetch(`${this.baseURL}/sync/changes?since=${sinceParam}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to get changes: ${error}`);
        }

        const result = await response.json();
        // Server returns { success: true, data: { changes: [...], sync_time: ... } }
        return result.data?.changes || [];
    }

    async processSync(
        lastSyncTime: Date,
        noteVersions: Record<string, number>
    ): Promise<SyncResponse> {
        const token = this.tokenManager.getToken();
        if (!token) throw new Error('Not authenticated');

        const deviceId = this.deviceManager.getDeviceId();
        if (!deviceId) throw new Error('Device not registered');

        const response = await fetch(`${this.baseURL}/sync/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                device_id: deviceId,
                last_sync_time: lastSyncTime.toISOString(),
                note_versions: noteVersions,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to process sync: ${error}`);
        }

        const result = await response.json();
        return result;
    }

    /**
     * Get compact manifest of all notes for efficient comparison
     * Returns only id, hash, version, updated_at, is_deleted
     * @param workspaceId Optional workspace ID to filter notes
     */
    async getManifest(workspaceId?: string): Promise<ManifestResponse> {
        const token = this.tokenManager.getToken();
        if (!token) throw new Error('Not authenticated');

        const url = workspaceId
            ? `${this.baseURL}/sync/manifest?workspace_id=${workspaceId}`
            : `${this.baseURL}/sync/manifest`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to get manifest: ${error}`);
        }

        const result = await response.json();
        // Server wraps response in { success, data } structure
        const data = result.data || result;

        // Validate and provide defaults for the response
        return {
            notes: Array.isArray(data?.notes) ? data.notes : [],
            sync_time: data?.sync_time || new Date().toISOString(),
        };
    }

    /**
     * Send local note state and get sync actions needed
     * Efficient batch comparison - single request instead of N requests
     * @param workspaceId Workspace ID to scope the comparison
     * @param localNotes Local note state for comparison
     */
    async batchDiff(workspaceId: string, localNotes: LocalNoteInfo[]): Promise<BatchDiffResponse> {
        const token = this.tokenManager.getToken();
        if (!token) throw new Error('Not authenticated');

        const deviceId = this.deviceManager.getDeviceId();
        if (!deviceId) throw new Error('Device not registered');

        const response = await fetch(`${this.baseURL}/sync/batch-diff`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                workspace_id: workspaceId,
                device_id: deviceId,
                local_notes: localNotes,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to batch diff: ${error}`);
        }

        const result = await response.json();
        // Server wraps response in { success, data } structure
        const data = result.data || result;

        // Validate and provide defaults
        return {
            to_download: Array.isArray(data?.to_download) ? data.to_download : [],
            to_upload: Array.isArray(data?.to_upload) ? data.to_upload : [],
            to_delete: Array.isArray(data?.to_delete) ? data.to_delete : [],
            conflicts: Array.isArray(data?.conflicts) ? data.conflicts : [],
            sync_time: data?.sync_time || new Date().toISOString(),
        };
    }
}
