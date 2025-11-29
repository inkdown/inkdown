import type { EncryptionManager } from './EncryptionManager';
import type { TokenManager } from './TokenManager';
import type { DeviceManager } from './DeviceManager';
import type {
    NoteResponse,
    CreateNoteRequest,
    UpdateNoteRequest,
    SyncResponse,
    NoteChange,
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
        // Handle null/undefined changes array
        return result.changes || [];
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
}
