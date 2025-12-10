import { Events } from '../Events';
import type { TokenManager } from './TokenManager';
import type { TokenRefreshService } from './TokenRefreshService';
import type { WSMessage } from './types';

interface WebSocketConfig {
    url: string;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    pingInterval?: number;
}

export class WebSocketService extends Events {
    private config: WebSocketConfig;
    private tokenManager: TokenManager;
    private tokenRefresh: TokenRefreshService | null = null;
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private pingTimer: NodeJS.Timeout | null = null;
    private isConnecting = false;
    private shouldReconnect = true;

    constructor(config: WebSocketConfig, tokenManager: TokenManager) {
        super();
        this.config = {
            reconnectInterval: 5000,
            maxReconnectAttempts: 10,
            pingInterval: 30000,
            ...config,
        };
        this.tokenManager = tokenManager;
    }

    /**
     * Set token refresh service (injected by SyncManager)
     */
    setTokenRefreshService(service: TokenRefreshService): void {
        this.tokenRefresh = service;
    }

    async connect(): Promise<void> {
        if (this.ws?.readyState === WebSocket.OPEN) {
            console.log('[WebSocketService] Already connected');
            return;
        }

        if (this.isConnecting) {
            console.log('[WebSocketService] Connection already in progress');
            return;
        }

        this.isConnecting = true;
        this.shouldReconnect = true;

        try {
            // Use TokenRefreshService if available to ensure valid token
            let token: string;
            if (this.tokenRefresh) {
                token = await this.tokenRefresh.ensureValidToken();
            } else {
                token = this.tokenManager.getToken() || '';
                if (!token) {
                    throw new Error('Not authenticated - cannot connect to WebSocket');
                }
            }

            const wsUrl = `${this.config.url}?token=${encodeURIComponent(token)}`;
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = this.handleOpen.bind(this);
            this.ws.onmessage = this.handleMessage.bind(this);
            this.ws.onerror = this.handleError.bind(this);
            this.ws.onclose = this.handleClose.bind(this);

            console.log('[WebSocketService] Connecting to:', this.config.url);
        } catch (error: any) {
            this.isConnecting = false;
            console.error('[WebSocketService] Connection error:', error);
            throw error;
        }
    }

    disconnect(): void {
        console.log('[WebSocketService] Disconnecting...');
        this.shouldReconnect = false;

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    send(message: WSMessage): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('[WebSocketService] Cannot send message - not connected');
            return;
        }

        const data = JSON.stringify(message);
        this.ws.send(data);
    }

    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    private handleOpen(): void {
        console.log('[WebSocketService] Connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.trigger('connected');

        this.startPing();
    }

    private handleMessage(event: MessageEvent): void {
        try {
            const message: WSMessage = JSON.parse(event.data);

            if (message.type !== 'ping' && message.type !== 'pong') {
                console.log('[WebSocketService] Message received:', message.type);
            }

            if (message.type === 'pong') {
                return;
            }

            if (message.type === 'ping') {
                this.send({ type: 'pong', timestamp: new Date().toISOString() });
                return;
            }

            this.trigger('message', message);
            this.trigger(message.type, message.payload);
        } catch (error: any) {
            console.error('[WebSocketService] Failed to parse message:', error);
        }
    }

    private handleError(event: Event): void {
        console.error('[WebSocketService] WebSocket error:', event);
        this.trigger('error', event);
    }

    private handleClose(event: CloseEvent): void {
        console.log('[WebSocketService] Disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.ws = null;

        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }

        this.trigger('disconnected', event);

        if (this.shouldReconnect) {
            this.attemptReconnect();
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
            console.error('[WebSocketService] Max reconnect attempts reached');
            this.trigger('reconnect_failed');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.config.reconnectInterval! * this.reconnectAttempts;

        console.log(
            `[WebSocketService] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`,
        );

        this.reconnectTimer = setTimeout(() => {
            this.connect().catch((error) => {
                console.error('[WebSocketService] Reconnect failed:', error);
            });
        }, delay);
    }

    private startPing(): void {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
        }

        this.pingTimer = setInterval(() => {
            if (this.isConnected()) {
                this.send({ type: 'ping', timestamp: new Date().toISOString() });
            }
        }, this.config.pingInterval!);
    }
}
