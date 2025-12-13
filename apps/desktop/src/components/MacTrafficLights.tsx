import { getCurrentWindow } from '@tauri-apps/api/window';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import './MacTrafficLights.css';

/**
 * Platform detection
 */
const isMacOS = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

/**
 * Traffic light button colors
 */
const colors = {
    close: { bg: '#ff5f56', unfocused: '#dddddd' },
    minimize: { bg: '#ffbd2e', unfocused: '#dddddd' },
    maximize: { bg: '#27c93f', unfocused: '#dddddd' },
};

/**
 * Traffic light button icons
 */
const icons = {
    close: (
        <svg width="8" height="8" viewBox="0 0 8 8">
            <path stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" d="M1 1l6 6M7 1L1 7" fill="none" />
        </svg>
    ),
    minimize: (
        <svg width="8" height="8" viewBox="0 0 8 8">
            <path stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" d="M1 4h6" fill="none" />
        </svg>
    ),
    maximize: (
        <svg width="8" height="8" viewBox="0 0 8 8">
            <path
                stroke="rgba(0,0,0,0.5)"
                strokeWidth="1.2"
                d="M1 4l3-3 3 3M1 4l3 3 3-3"
                fill="none"
            />
        </svg>
    ),
};

/**
 * macOS-style traffic light button
 */
interface TrafficLightButtonProps {
    type: 'close' | 'minimize' | 'maximize';
    onClick: () => void;
    isFocused: boolean;
    /** Whether any button in the group is hovered (shows all icons) */
    isGroupHovered: boolean;
}

const TrafficLightButton: React.FC<TrafficLightButtonProps> = ({
    type,
    onClick,
    isFocused,
    isGroupHovered,
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className="mac-traffic-light"
            style={{
                backgroundColor: isFocused ? colors[type].bg : colors[type].unfocused,
            }}
        >
            {/* Show icon when group is hovered AND window is focused (like native macOS) */}
            {isGroupHovered && isFocused && icons[type]}
        </button>
    );
};

export interface MacTrafficLightsProps {
    /** Whether to show - only renders on macOS */
    enabled?: boolean;
}

/**
 * MacTrafficLights Component
 *
 * Renders macOS-style traffic light buttons (close, minimize, maximize)
 * positioned in the FileExplorer header area.
 *
 * Behavior matches native macOS:
 * - All icons appear when hovering any button in the group
 * - Icons only show when window is focused
 * - Colors change when window loses focus
 */
export const MacTrafficLights: React.FC<MacTrafficLightsProps> = ({ enabled = true }) => {
    const [isFocused, setIsFocused] = useState(true);
    const [isGroupHovered, setIsGroupHovered] = useState(false);

    // Check focus state on mount
    useEffect(() => {
        if (!isMacOS || !enabled) return;

        // Listen for focus changes
        const unlistenFocus = getCurrentWindow().onFocusChanged(({ payload: focused }) => {
            setIsFocused(focused);
        });

        return () => {
            unlistenFocus.then((fn) => fn());
        };
    }, [enabled]);

    const appWindow = getCurrentWindow();

    const handleClose = useCallback(() => {
        appWindow.close();
    }, [appWindow]);

    const handleMinimize = useCallback(() => {
        appWindow.minimize();
    }, [appWindow]);

    const handleMaximize = useCallback(() => {
        appWindow.toggleMaximize();
    }, [appWindow]);

    // Don't render on non-macOS or when disabled
    if (!isMacOS || !enabled) {
        return null;
    }

    return (
        <div
            className="mac-traffic-lights"
            onMouseEnter={() => setIsGroupHovered(true)}
            onMouseLeave={() => setIsGroupHovered(false)}
        >
            <TrafficLightButton
                type="close"
                onClick={handleClose}
                isFocused={isFocused}
                isGroupHovered={isGroupHovered}
            />
            <TrafficLightButton
                type="minimize"
                onClick={handleMinimize}
                isFocused={isFocused}
                isGroupHovered={isGroupHovered}
            />
            <TrafficLightButton
                type="maximize"
                onClick={handleMaximize}
                isFocused={isFocused}
                isGroupHovered={isGroupHovered}
            />
        </div>
    );
};
