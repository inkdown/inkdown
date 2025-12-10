/**
 * IPlatform Interface
 *
 * Platform environment - Groups Window, Shell, and Process
 */

import type { PlatformInfo } from '../types';

// ============================================================================
// Window Controls (Desktop only)
// ============================================================================

export interface IWindowControls {
    minimize(): Promise<void>;
    maximize(): Promise<void>;
    toggleMaximize(): Promise<void>;
    close(): Promise<void>;
    isMaximized(): Promise<boolean>;
    setTitle(title: string): Promise<void>;
    onFocusChanged(callback: (focused: boolean) => void): () => void;
}

// ============================================================================
// Shell (Partial on mobile)
// ============================================================================

export interface IShell {
    /**
     * Open URL in default browser
     * Available on all platforms
     */
    openUrl(url: string): Promise<void>;

    /**
     * Open file/folder with default application
     * @platform desktop
     */
    openPath?(path: string): Promise<void>;

    /**
     * Show item in file explorer
     * @platform desktop
     */
    showInFolder?(path: string): Promise<void>;
}

// ============================================================================
// Process Control
// ============================================================================

export interface IProcessControl {
    /**
     * Exit the application
     */
    exit(code?: number): void;

    /**
     * Restart the application
     * @platform desktop
     */
    restart?(): Promise<void>;
}

// ============================================================================
// Platform (Combines all)
// ============================================================================

export interface IPlatform {
    /**
     * Platform information - REQUIRED
     */
    info: PlatformInfo;

    /**
     * Window controls - DESKTOP ONLY
     */
    window?: IWindowControls;

    /**
     * Shell/opener - PARTIAL on mobile
     */
    shell: IShell;

    /**
     * Process control
     */
    process: IProcessControl;
}
