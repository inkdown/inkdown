import { getCurrentWindow } from '@tauri-apps/api/window';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

/**
 * Platform detection
 */
const isMacOS = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

/**
 * Window control button icons
 */
const MinimizeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24">
        <path fill="currentColor" d="M19 13H5v-2h14z" />
    </svg>
);

const MaximizeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24">
        <path fill="currentColor" d="M4 4h16v16H4zm2 4v10h12V8z" />
    </svg>
);

const RestoreIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24">
        <path fill="currentColor" d="M4 8h4V4h12v12h-4v4H4V8zm12 0v6h2V6H10v2h6zM6 10v8h8v-8H6z" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24">
        <path
            fill="currentColor"
            d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z"
        />
    </svg>
);

/**
 * macOS-style traffic light button
 */
interface TrafficLightButtonProps {
    type: 'close' | 'minimize' | 'maximize';
    onClick: () => void;
    isHovered: boolean;
}

const TrafficLightButton: React.FC<TrafficLightButtonProps> = ({ type, onClick, isHovered }) => {
    const colors = {
        close: { bg: '#ff5f56', hover: '#ff5f56' },
        minimize: { bg: '#ffbd2e', hover: '#ffbd2e' },
        maximize: { bg: '#27c93f', hover: '#27c93f' },
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
            className="titlebar-traffic-light"
            style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: colors[type].bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'default',
                padding: 0,
                marginRight: type !== 'maximize' ? '8px' : '0',
            }}
        >
            {isHovered && icons[type]}
        </button>
    );
};

/**
 * Windows-style window control button
 */
interface WindowsControlButtonProps {
    type: 'minimize' | 'maximize' | 'close';
    onClick: () => void;
    isMaximized?: boolean;
}

const WindowsControlButton: React.FC<WindowsControlButtonProps> = ({
    type,
    onClick,
    isMaximized,
}) => {
    const icons = {
        minimize: <MinimizeIcon />,
        maximize: isMaximized ? <RestoreIcon /> : <MaximizeIcon />,
        close: <CloseIcon />,
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`titlebar-control-button titlebar-control-${type}`}
            style={{
                width: '46px',
                height: '100%',
                border: 'none',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'default',
                color: 'var(--text-normal)',
                padding: 0,
            }}
        >
            {icons[type]}
        </button>
    );
};

export interface CustomTitleBarProps {
    /** Content to render in the titlebar (e.g., tabs) */
    children?: React.ReactNode;
    /** Workspace name to display (macOS only, next to traffic lights) */
    workspaceName?: string;
}

/**
 * CustomTitleBar Component
 * 
 * Provides a cross-platform custom title bar with window controls.
 * - macOS: Traffic lights on the left, content in center
 * - Windows/Linux: Content on left, window controls on right
 */
export const CustomTitleBar: React.FC<CustomTitleBarProps> = ({
    children,
    workspaceName,
}) => {
    const [isMaximized, setIsMaximized] = useState(false);
    const [isHoveringTrafficLights, setIsHoveringTrafficLights] = useState(false);

    // Check maximized state on mount and listen for changes
    useEffect(() => {
        const checkMaximized = async () => {
            const window = getCurrentWindow();
            const maximized = await window.isMaximized();
            setIsMaximized(maximized);
        };

        checkMaximized();

        // Listen for window resize to update maximized state
        const unlisten = getCurrentWindow().onResized(() => {
            checkMaximized();
        });

        return () => {
            unlisten.then(fn => fn());
        };
    }, []);

    const handleMinimize = useCallback(async () => {
        await getCurrentWindow().minimize();
    }, []);

    const handleMaximize = useCallback(async () => {
        await getCurrentWindow().toggleMaximize();
    }, []);

    const handleClose = useCallback(async () => {
        await getCurrentWindow().close();
    }, []);

    // Styles
    const titleBarStyle = {
        height: '38px',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'var(--background-primary)',
        borderBottom: '1px solid var(--background-modifier-border)',
        position: 'relative' as const,
        userSelect: 'none' as const,
        WebkitAppRegion: 'drag' as 'drag',
    } as React.CSSProperties & { WebkitAppRegion: 'drag' | 'no-drag' };

    const contentStyle = {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        overflow: 'hidden' as const,
        WebkitAppRegion: 'no-drag' as 'no-drag',
    } as React.CSSProperties & { WebkitAppRegion: 'drag' | 'no-drag' };

    const controlsStyle = {
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        WebkitAppRegion: 'no-drag' as 'no-drag',
    } as React.CSSProperties & { WebkitAppRegion: 'drag' | 'no-drag' };

    if (isMacOS) {
        // macOS layout: [traffic lights] [workspace name] [content] 
        return (
            <div style={titleBarStyle} data-tauri-drag-region>
                {/* Traffic Lights */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '13px',
                        paddingRight: '12px',
                        height: '100%',
                        WebkitAppRegion: 'no-drag',
                    } as React.CSSProperties & { WebkitAppRegion: 'no-drag' }}
                    onMouseEnter={() => setIsHoveringTrafficLights(true)}
                    onMouseLeave={() => setIsHoveringTrafficLights(false)}
                >
                    <TrafficLightButton
                        type="close"
                        onClick={handleClose}
                        isHovered={isHoveringTrafficLights}
                    />
                    <TrafficLightButton
                        type="minimize"
                        onClick={handleMinimize}
                        isHovered={isHoveringTrafficLights}
                    />
                    <TrafficLightButton
                        type="maximize"
                        onClick={handleMaximize}
                        isHovered={isHoveringTrafficLights}
                    />
                </div>

                {/* Workspace name */}
                {workspaceName && (
                    <div
                        style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--text-muted)',
                            marginRight: '12px',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {workspaceName}
                    </div>
                )}

                {/* Content (tabs) */}
                <div style={contentStyle}>{children}</div>
            </div>
        );
    }

    // Windows/Linux layout: [content] [minimize] [maximize] [close]
    return (
        <div style={titleBarStyle} data-tauri-drag-region>
            {/* Content (tabs) */}
            <div style={contentStyle}>{children}</div>

            {/* Window Controls */}
            <div style={controlsStyle}>
                <WindowsControlButton type="minimize" onClick={handleMinimize} />
                <WindowsControlButton
                    type="maximize"
                    onClick={handleMaximize}
                    isMaximized={isMaximized}
                />
                <WindowsControlButton type="close" onClick={handleClose} />
            </div>
        </div>
    );
};

/**
 * CSS for titlebar styling - inject this in your app
 */
export const titleBarStyles = `
.titlebar-control-button:hover {
    background-color: var(--background-modifier-hover) !important;
}

.titlebar-control-close:hover {
    background-color: #e81123 !important;
    color: white !important;
}

.titlebar-traffic-light:hover {
    filter: brightness(0.9);
}
`;
