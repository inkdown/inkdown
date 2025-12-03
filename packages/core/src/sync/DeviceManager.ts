import type {
    Device,
    DeviceResponse,
    DevicesListResponse,
    RegisterDeviceData,
} from './types';

/**
 * DeviceManager - Manages device registration and tracking
 */
export class DeviceManager {
    private deviceId: string | null = null;
    private readonly DEVICE_ID_KEY = 'inkdown-device-id';
    private baseURL: string;

    constructor(baseURL: string = 'http://localhost:8080/api/v1') {
        this.baseURL = baseURL;
        this.loadDeviceId();
    }

    /**
     * Update the base URL for API requests
     */
    setBaseURL(url: string): void {
        this.baseURL = url;
    }

    /**
     * Load device ID from localStorage
     */
    private loadDeviceId(): void {
        this.deviceId = localStorage.getItem(this.DEVICE_ID_KEY);
        console.log('[DeviceManager] Loaded device ID:', this.deviceId || 'None');
    }

    /**
     * Generate and save a new device ID
     */
    private generateDeviceId(): string {
        const id = crypto.randomUUID();
        localStorage.setItem(this.DEVICE_ID_KEY, id);
        this.deviceId = id;
        console.log('[DeviceManager] Generated new device ID:', id);
        return id;
    }

    /**
     * Get current device ID (generate if doesn't exist)
     */
    getDeviceId(): string {
        if (!this.deviceId) {
            this.deviceId = this.generateDeviceId();
        }
        return this.deviceId;
    }

    /**
     * Get device information for registration
     */
    getDeviceInfo(): RegisterDeviceData {
        const platform = this.getPlatform();
        const deviceName = this.getDeviceName();

        return {
            name: deviceName,
            type: 'desktop', // For now, desktop only (Tauri app)
            os: platform,
            app_version: '1.0.0', // TODO: Get from package.json
        };
    }

    /**
     * Get platform/OS information
     */
    private getPlatform(): string {
        // In Tauri, we can use navigator.userAgent or process
        if (typeof window !== 'undefined') {
            const ua = window.navigator.userAgent;
            if (ua.includes('Mac')) return 'darwin';
            if (ua.includes('Windows')) return 'windows';
            if (ua.includes('Linux')) return 'linux';
        }
        return 'unknown';
    }

    /**
     * Get device name
     */
    private getDeviceName(): string {
        const platform = this.getPlatform();

        // Simple default name based on platform
        const platformNames: Record<string, string> = {
            darwin: 'Mac',
            windows: 'Windows PC',
            linux: 'Linux PC',
            unknown: 'Device',
        };

        return `${platformNames[platform] || 'Device'}`;
    }

    /**
     * Register current device with the server
     */
    async registerDevice(accessToken: string): Promise<Device> {
        console.log('[DeviceManager] Registering device...');

        const deviceInfo = this.getDeviceInfo();
        const deviceId = this.getDeviceId();

        const response = await fetch(`${this.baseURL}/devices/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(deviceInfo),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Device registration failed' }));
            throw new Error(error.message || 'Device registration failed');
        }

        const result: DeviceResponse = await response.json();
        console.log('[DeviceManager] Device registered:', result.data);

        // Update stored device ID with the one from server
        if (result.data.id !== deviceId) {
            localStorage.setItem(this.DEVICE_ID_KEY, result.data.id);
            this.deviceId = result.data.id;
        }

        return result.data;
    }

    /**
     * Get list of all registered devices for the user
     */
    async getDevices(accessToken: string): Promise<Device[]> {
        const response = await fetch(`${this.baseURL}/devices`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch devices');
        }

        const result: DevicesListResponse = await response.json();
        return result.data;
    }

    /**
     * Revoke a device (remove access)
     */
    async revokeDevice(accessToken: string, deviceId: string): Promise<void> {
        const response = await fetch(`${this.baseURL}/devices/${deviceId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to revoke device');
        }

        console.log('[DeviceManager] Device revoked:', deviceId);
    }

    /**
     * Check if current device is registered
     */
    hasDeviceId(): boolean {
        return !!this.deviceId;
    }
}
