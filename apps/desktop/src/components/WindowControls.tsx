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
        close: { bg: '#ff5f56' },
        minimize: { bg: '#ffbd2e' },
        maximize: { bg: '#27c93f' },
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
interface WindowControlButtonProps {
    type: 'minimize' | 'maximize' | 'close';
    onClick: () => void;
    isMaximized?: boolean;
}

const WindowControlButton: React.FC<WindowControlButtonProps> = ({
    type,
    onClick,
    isMaximized = false,
}) => {
    const getIcon = () => {
        switch (type) {
            case 'minimize':
                return <MinimizeIcon />;
            case 'maximize':
                return isMaximized ? <RestoreIcon /> : <MaximizeIcon />;
            case 'close':
                return <CloseIcon />;
        }
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`window-control-button window-control-${type}`}
            style={{
                width: '46px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'default',
                transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
                if (type === 'close') {
                    e.currentTarget.style.backgroundColor = '#e81123';
                    e.currentTarget.style.color = '#ffffff';
                } else {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
            }}
        >
            {getIcon()}
        </button>
    );
};

/**
 * Window Controls Component
 * Renders platform-specific window controls (minimize, maximize, close)
 */
export interface WindowControlsProps {
    /** Workspace name to display (macOS only) */
    workspaceName?: string;
}

export const WindowControls: React.FC<WindowControlsProps> = ({ workspaceName }) => {
    const [isMaximized, setIsMaximized] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Check if window is maximized on mount
    useEffect(() => {
        const checkMaximized = async () => {
            const window = getCurrentWindow();
            const maximized = await window.isMaximized();
            setIsMaximized(maximized);
        };
        checkMaximized();
    }, []);

    const handleMinimize = useCallback(async () => {
        const window = getCurrentWindow();
        await window.minimize();
    }, []);

    const handleMaximize = useCallback(async () => {
        const window = getCurrentWindow();
        await window.toggleMaximize();
        const maximized = await window.isMaximized();
        setIsMaximized(maximized);
    }, []);

    const handleClose = useCallback(async () => {
        const window = getCurrentWindow();
        await window.close();
    }, []);

    if (isMacOS) {
        return (
            <div
                className="window-controls-macos"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                    <TrafficLightButton type="close" onClick={handleClose} isHovered={isHovered} />
                    <TrafficLightButton
                        type="minimize"
                        onClick={handleMinimize}
                        isHovered={isHovered}
                    />
                    <TrafficLightButton
                        type="maximize"
                        onClick={handleMaximize}
                        isHovered={isHovered}
                    />
                </div>
                {workspaceName && (
                    <span
                        style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            userSelect: 'none',
                        }}
                    >
                        {workspaceName}
                    </span>
                )}
            </div>
        );
    }

    // Windows/Linux controls
    return (
        <div
            className="window-controls-windows"
            style={{
                display: 'flex',
                alignItems: 'center',
                height: '100%',
            }}
        >
            <WindowControlButton type="minimize" onClick={handleMinimize} />
            <WindowControlButton type="maximize" onClick={handleMaximize} isMaximized={isMaximized} />
            <WindowControlButton type="close" onClick={handleClose} />
        </div>
    );
};
