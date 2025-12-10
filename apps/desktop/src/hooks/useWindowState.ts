/**
 * useWindowState - Hook for managing window size and state persistence
 *
 * Saves and restores window dimensions, position, and maximized/fullscreen state.
 *
 * Note: We use Physical coordinates for consistency, as innerSize() and outerPosition()
 * return physical pixels. On HiDPI displays (like Retina), logical != physical.
 */

import type { App, WindowState } from '@inkdown/core';
import { PhysicalPosition, PhysicalSize } from '@tauri-apps/api/dpi';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useEffect, useRef } from 'react';

// Debounce time for saving window state (ms)
const SAVE_DEBOUNCE_MS = 500;

/**
 * Hook to manage window state persistence
 */
export function useWindowState(app: App) {
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isRestoringRef = useRef(false);

    // Restore window state on mount
    useEffect(() => {
        const restoreWindowState = async () => {
            try {
                isRestoringRef.current = true;
                const state = await app.windowConfigManager.getWindowState();
                const window = getCurrentWindow();

                console.log('[WindowState] Restoring state:', state);

                // First, restore size if not maximized/fullscreen
                if (!state.isMaximized && !state.isFullscreen) {
                    // Set size using Physical pixels (matches what we save from innerSize())
                    await window.setSize(new PhysicalSize(state.width, state.height));
                    console.log('[WindowState] Set size:', state.width, 'x', state.height);

                    // Set position if available using Physical pixels (matches outerPosition())
                    if (state.x !== undefined && state.y !== undefined) {
                        await window.setPosition(new PhysicalPosition(state.x, state.y));
                        console.log('[WindowState] Set position:', state.x, ',', state.y);
                    }
                }

                // Then apply maximized/fullscreen state
                if (state.isFullscreen) {
                    await window.setFullscreen(true);
                    console.log('[WindowState] Set fullscreen');
                } else if (state.isMaximized) {
                    await window.maximize();
                    console.log('[WindowState] Set maximized');
                }

                // Center window if no position was saved
                if (
                    state.x === undefined &&
                    state.y === undefined &&
                    !state.isMaximized &&
                    !state.isFullscreen
                ) {
                    await window.center();
                    console.log('[WindowState] Centered window');
                }

                isRestoringRef.current = false;
            } catch (error: any) {
                console.error('Failed to restore window state:', error);
                isRestoringRef.current = false;
            }
        };

        restoreWindowState();
    }, [app]);

    // Save window state on resize/move
    useEffect(() => {
        const window = getCurrentWindow();

        const saveState = async () => {
            // Don't save while restoring
            if (isRestoringRef.current) return;

            try {
                const [size, position, isMaximized, isFullscreen] = await Promise.all([
                    window.innerSize(),
                    window.outerPosition(),
                    window.isMaximized(),
                    window.isFullscreen(),
                ]);

                const state: WindowState = {
                    width: size.width,
                    height: size.height,
                    x: position.x,
                    y: position.y,
                    isMaximized,
                    isFullscreen,
                };

                console.log('[WindowState] Saving state:', state);
                await app.windowConfigManager.saveWindowState(state);
            } catch (error: any) {
                console.error('Failed to save window state:', error);
            }
        };

        const debouncedSave = () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            saveTimeoutRef.current = setTimeout(saveState, SAVE_DEBOUNCE_MS);
        };

        // Listen for window events
        let unlistenResize: (() => void) | null = null;
        let unlistenMove: (() => void) | null = null;

        const setupListeners = async () => {
            unlistenResize = await window.onResized(debouncedSave);
            unlistenMove = await window.onMoved(debouncedSave);
        };

        setupListeners();

        // Save state when window is about to close
        const handleBeforeUnload = () => {
            // Force immediate save
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            // Note: async operations may not complete on unload,
            // but the debounced save should have already captured the state
        };
        globalThis.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            unlistenResize?.();
            unlistenMove?.();
            globalThis.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [app]);
}
