// Sync Plugin Types

export interface AuthResponse {
    data: {
        access_token: string;
        refresh_token: string;
        expires_in: number;
        user: {
            id: string;
            username: string;
            email: string;
        };
    }
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface SyncConfig {
    onboardingCompleted?: boolean;
    mode?: 'online' | 'offline';
    enabled?: boolean;
    localDbName?: string;
    serverUrl?: string;
}

// ============================================
// Sync Types (Multi-Device Sync)
// ============================================

export type NoteType = 'file' | 'directory';

export interface NoteResponse {
    id: string;
    parent_id?: string | null;
    type: NoteType;
    encrypted_title: string;
    encrypted_content?: string;
    encryption_algo: string;
    nonce: string;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    version: number;
    content_hash: string;
    last_edit_device: string;
}

export interface NoteSync {
    id: string;
    user_id: string;
    parent_id?: string | null;
    type: NoteType;
    encrypted_title: string;
    encrypted_content?: string;
    encryption_algo: string;
    nonce: string;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    version: number;
    content_hash: string;
    last_edit_device: string;
}

export interface CreateNoteRequest {
    parent_id?: string | null;
    type: NoteType;
    encrypted_title: string;
    encrypted_content?: string;
    encryption_algo: string;
    nonce: string;
    content_hash?: string;
    device_id: string;
}

export interface UpdateNoteRequest {
    encrypted_title?: string;
    encrypted_content?: string;
    encryption_algo?: string;
    nonce?: string;
    parent_id?: string | null;
    is_deleted?: boolean;
    expected_version?: number;
    content_hash?: string;
    device_id: string;
}

export interface FileChangeEvent {
    type: 'create' | 'modify' | 'delete' | 'rename';
    path: string;
    oldPath?: string;
    timestamp: Date;
    contentHash?: string;
}

export interface SyncRequest {
    device_id: string;
    last_sync_time: string;
    note_versions: Record<string, number>;
}

export interface NoteChange {
    note_id: string;
    operation: 'update' | 'delete';
    version: number;
    note?: NoteResponse;
}

export interface SyncResponse {
    changes: NoteChange[];
    sync_time: string;
    has_more: boolean;
}

// WebSocket Message Types
export type WSMessageType =
    | 'sync_request'
    | 'sync_response'
    | 'note_update'
    | 'note_delete'
    | 'conflict'
    | 'ack'
    | 'ping'
    | 'pong';

export interface WSMessage {
    type: WSMessageType;
    timestamp: string;
    payload?: any;
}

export interface NoteUpdatePayload {
    note_id: string;
    version: number;
    encrypted_title: string;
    encrypted_content: string;
    updated_at: string;
    device_id: string;
}

export interface NoteDeletePayload {
    note_id: string;
    version: number;
    device_id: string;
}

export interface ConflictPayload {
    conflict_id: string;
    note_id: string;
    server_version: number;
    client_version: number;
    server_data: any;
}

export interface ConflictResolution {
    strategy: 'keep_local' | 'keep_remote' | 'merge';
    note_data?: NoteResponse;
}

// Device Types
export interface Device {
    id: string;
    name: string;
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    app_version: string;
    last_active: string;
    is_revoked: boolean;
}

export interface RegisterDeviceData {
    name: string;
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    app_version: string;
}

export interface DeviceResponse {
    data: Device;
}

export interface DevicesListResponse {
    data: Device[];
}

// Encryption Types
export interface EncryptedData {
    encrypted_content: string; // base64
    nonce: string; // base64, IV for GCM
    encryption_algo: 'AES-256-GCM';
}

export interface EncryptedNote {
    encrypted_title: string; // base64
    encrypted_content: string; // base64
    encryption_algo: 'AES-256-GCM';
    nonce: string; // base64
    content_hash: string; // SHA-256
}

export interface EncryptionKeys {
    encrypted_key: string; // base64
    key_salt: string; // base64
    kdf_params: string; // JSON string
    encryption_algo: 'AES-256-GCM';
}

export interface KeySyncResponse {
    data: EncryptionKeys & {
        updated_at: string;
    };
}

// Note Sync Types
export interface Note {
    id: string;
    parent_id: string | null;
    type: 'file' | 'directory';
    encrypted_title: string;
    encrypted_content?: string;
    encryption_algo: string;
    nonce: string;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    version: number;
    content_hash: string;
    last_edit_device: string;
}

export interface CreateNoteData {
    parent_id?: string | null;
    type: 'file' | 'directory';
    encrypted_title: string;
    encrypted_content?: string;
    encryption_algo: 'AES-256-GCM';
    nonce: string;
    content_hash: string;
    device_id: string;
}

export interface UpdateNoteData {
    encrypted_title?: string;
    encrypted_content?: string;
    encryption_algo?: 'AES-256-GCM';
    nonce?: string;
    parent_id?: string | null;
    is_deleted?: boolean;
    expected_version?: number;
    content_hash?: string;
    device_id: string;
}

export interface NoteResponse {
    data: Note;
}

export interface NotesListResponse {
    data: Note[];
}
