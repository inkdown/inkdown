import { getCurrentWindow } from '@tauri-apps/api/window';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import './MacTrafficLights.css';

/**
 * Platform detection
 */
const isMacOS = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

/**
 * macOS-style traffic light button
 */
interface TrafficLightButtonProps {
    type: 'close' | 'minimize' | 'maximize';
    onClick: () => void;
    isFocused: boolean;
}

const TrafficLightButton: React.FC<TrafficLightButtonProps> = ({ 
    type, 
    onClick,
    isFocused 
}) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const colors = {
        close: { bg: '#ff5f56', unfocused: '#dddddd' },
        minimize: { bg: '#ffbd2e', unfocused: '#dddddd' },
        maximize: { bg: '#27c93f', unfocused: '#dddddd' },
    };

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
                <path stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" d="M1 4l3-3 3 3M1 4l3 3 3-3" fill="none" />
            </svg>
        ),
    };

    return (
        <button
            type="button"
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="mac-traffic-light"
            style={{
                backgroundColor: isFocused ? colors[type].bg : colors[type].unfocused,
            }}
        >
            {isHovered && isFocused && icons[type]}
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
 */
export const MacTrafficLights: React.FC<MacTrafficLightsProps> = ({ enabled = true }) => {
    const [isFocused, setIsFocused] = useState(true);

    // Don't render on non-macOS or when disabled
    if (!isMacOS || !enabled) {
        return null;
    }

    // Check focus state on mount
    useEffect(() => {
        // Listen for focus changes
        const unlistenFocus = getCurrentWindow().onFocusChanged(({ payload: focused }) => {
            setIsFocused(focused);
        });

        return () => {
            unlistenFocus.then(fn => fn());
        };
    }, []);

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

    return (
        <div className="mac-traffic-lights">
            <TrafficLightButton
                type="close"
                onClick={handleClose}
                isFocused={isFocused}
            />
            <TrafficLightButton
                type="minimize"
                onClick={handleMinimize}
                isFocused={isFocused}
            />
            <TrafficLightButton
                type="maximize"
                onClick={handleMaximize}
                isFocused={isFocused}
            />
        </div>
    );
};
